import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {ChatContextValue} from "@/model/ws.types";
import {ChatConnectionState, ChatMessage, ChatUser, WsEvent} from "@/model/chat.types";
import AsyncStorage from "@react-native-async-storage/async-storage"
import {chatWebSocket} from "@/ws/chatWebSocket";
import {ChatApiService} from "@/service/chatService";

const ChatContext = createContext<ChatContextValue|null>(null);

const STORAGE_KEY_USER = "@key_user";
const STORAGE_KEY_TOKEN = "@key_token";
const TYPING_TIMEOUT_MS = 3_000;

export function ChatProvider({ children }:{children:ReactNode|ReactNode[]}) {

    const [currentUser,setCurrentUser]  = useState<ChatUser|null>(null);
    const [token,setToken] = useState<string|null>(null);
    const [isLoadingSession,setIsLoadingSession]= useState<boolean>(true);
    const [connectionState, setConnectionState] = useState<ChatConnectionState>("idle");
    const [onlineUsers,setOnlineUsers] = useState<ChatUser[]>([]);
    const [groupMessages,setGroupMessages] = useState<ChatMessage[]>([]);
    const [directMessages,setDirectMessages] = useState<Record<string, ChatMessage[]>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const [readReceipts, setReadReceipts] = useState<Record<string, {seen_by:string; seen_at:string}[]>>({});
    const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


    const currentUserRef = useRef<ChatUser|null>(null);
    const tokenRef = useRef<string|null>(null);
    const cleanupWsRef = useRef<(() => void) | null>(null);


    //Restaurar la sesion

    useEffect(() => {
        const restoreSession = async () => {
            try{
                const [savedSession,savedToken] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEY_USER),
                    AsyncStorage.getItem(STORAGE_KEY_TOKEN),
                ])

                if(savedSession && savedToken){
                    const savedUser =  JSON.parse(savedSession);
                    currentUserRef.current = savedUser;
                    tokenRef.current = savedToken;
                    setCurrentUser(currentUserRef.current);
                    setToken(savedToken);

                    _connectWs(savedToken);
                }
            }catch(ignored) {

            }finally {
                setIsLoadingSession(false)
            }
        }
        void restoreSession();
    }, []);


    const handleWsEvent = useCallback((event:WsEvent) => {

        switch (event.type) {
            case "group_history":
                setGroupMessages(event.messages);
                break;
            case "group_message":
                setGroupMessages((prev)=>[...prev, event.message]);
                break;
            case "dm":
                const message = event.message;
                const myId = currentUserRef.current?.id ;

                const otherUserId = message.sender_id === myId ? message.recipient_id! : message.sender_id;
                setDirectMessages((prev)=>({
                    ...prev,
                    [otherUserId]:[...(prev[otherUserId]??[]), message]
                }))
            break;

            case "users_list":
                setOnlineUsers(event.users);
                break;
            case "user_joined":
                setOnlineUsers((prev)=>{
                    const exist = prev.some(item=>item.id === event.user.id);
                    return exist?prev:[...prev, event.user];
                })
                break;
            case "user_left":
                setOnlineUsers((prev)=>prev.filter(item=>item.id!==event.user_id));
                break;
            case "typing": {
                const {user_id, nickname} = event;
                if (user_id === currentUserRef.current?.id) break;
                setTypingUsers((prev) => ({...prev, [user_id]: nickname}));
                if (typingTimersRef.current[user_id]) {
                    clearTimeout(typingTimersRef.current[user_id]);
                }
                typingTimersRef.current[user_id] = setTimeout(() => {
                    setTypingUsers((prev) => {
                        const next = {...prev};
                        delete next[user_id];
                        return next;
                    });
                    delete typingTimersRef.current[user_id];
                }, TYPING_TIMEOUT_MS);
                break;
            }
            case "stop_typing": {
                const {user_id} = event;
                setTypingUsers((prev) => {
                    const next = {...prev};
                    delete next[user_id];
                    return next;
                });
                if (typingTimersRef.current[user_id]) {
                    clearTimeout(typingTimersRef.current[user_id]);
                    delete typingTimersRef.current[user_id];
                }
                break;
            }
            case "message_seen": {
                const {message_id, seen_by, seen_at} = event;
                setReadReceipts((prev) => {
                    const existing = prev[message_id] ?? [];
                    if (existing.some((r) => r.seen_by === seen_by)) return prev;
                    return {...prev, [message_id]: [...existing, {seen_by, seen_at}]};
                });
                break;
            }
            case "error":
                console.log("Chat event error: ",event);
                break;

            default:
                break;
        }
    },[])

    const _connectWs = useCallback((wsToken:string)=>{

        cleanupWsRef.current?.();
        cleanupWsRef.current  = null;



        setConnectionState("connecting");

        const unSubEvent = chatWebSocket.onEvent(handleWsEvent);
        const unSubConnect = chatWebSocket.onConnect(()=>{
            setConnectionState("connected");
        });

        const unSubDisconnect = chatWebSocket.onDisconnect(()=>{
            setConnectionState("disconnected");
        })

        chatWebSocket.connect(wsToken)

        cleanupWsRef.current = ()=>{
            unSubEvent();
            unSubDisconnect();
            unSubConnect();
        }
    },[handleWsEvent])


    const joinChat = useCallback( async (nickname:string)=>{
        const {user,token:newToken} = await ChatApiService.join(nickname);

        await Promise.all([
            AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user)),
            AsyncStorage.setItem(STORAGE_KEY_TOKEN, newToken),
        ])

        currentUserRef.current = user;
        tokenRef.current = newToken;
        setCurrentUser(user);
        setToken(newToken);
        _connectWs(newToken);
    },[_connectWs])


    const leaveChat = useCallback(()=>{
        cleanupWsRef.current?.()
        cleanupWsRef.current = null;
        chatWebSocket.disconnect();
        AsyncStorage.multiRemove([STORAGE_KEY_TOKEN,STORAGE_KEY_USER]);
        currentUserRef.current = null;
        tokenRef.current = null;
        setToken(null);
        setCurrentUser(null);
        setConnectionState("idle");
        setOnlineUsers([]);
        setGroupMessages([]);
        setDirectMessages({});
    },[])


    const sendGroupMessage = useCallback((content:string)=> {
        chatWebSocket.sendGroupMessage(content);
    },[])

    const sendDirectMessage = useCallback((toUserTo:string,content:string)=>{
        chatWebSocket.sendDM(toUserTo,content);
    },[])

    const sendTyping = useCallback(()=>{
        chatWebSocket.sendTyping();
    },[])

    const sendStopTyping = useCallback(()=>{
        chatWebSocket.sendStopTyping();
    },[])

    const sendMarkRead = useCallback((messageId:string)=>{
        chatWebSocket.sendMarkRead(messageId);
    },[])

    const loadDirectMessages = useCallback(async (otherUserId:string)=>{
        if(!tokenRef.current){
            return;
        }
        try{
         const history = await ChatApiService.getDMHistory(otherUserId,tokenRef.current);
         setDirectMessages((prev)=>({
             ...prev,
             [otherUserId]:history
         }))
        }catch (ignored){

        }
    },[])


    useEffect(() => {
        return () => {
            Object.values(typingTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    const values = useMemo<ChatContextValue>(
        ()=>({
            currentUser,
            token,
            isLoadingSession,
            connectionState,
            onlineUsers,
            directMessages,
            typingUsers,
            readReceipts,
            joinChat,
            leaveChat,
            sendDirectMessage,
            sendGroupMessage,
            sendTyping,
            sendStopTyping,
            sendMarkRead,
            loadDirectMessages,
            groupMessages
        }),[currentUser,
            token,
            isLoadingSession,
            connectionState,
            onlineUsers,
            directMessages,
            typingUsers,
            readReceipts,
            joinChat,
            leaveChat,
            sendDirectMessage,
            sendGroupMessage,
            sendTyping,
            sendStopTyping,
            sendMarkRead,
            loadDirectMessages,
            groupMessages],
    )

    return (
        <ChatContext.Provider value={values}>{children}</ChatContext.Provider>
    )
}

export function useChatContext():ChatContextValue{
    const context = useContext(ChatContext);
    if(!context){
        throw new Error("Error al crear el contexto");
    }
    return context;
}