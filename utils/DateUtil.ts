export const DateUtil = {
    getHour: (date: string) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    }
}