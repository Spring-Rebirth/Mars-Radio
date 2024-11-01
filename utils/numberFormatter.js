// utils/numberFormatter.js
export function formatNumberWithUnits(number) {
    if (number >= 1e9) {
        // 十亿以上，保留一位小数
        let num = (number / 1e9).toFixed(1);
        num = num.replace(/\.0$/, ''); // 如果小数部分为 .0，则移除
        return num + 'B';
    } else if (number >= 1e6) {
        // 一百万以上，保留一位小数
        let num = (number / 1e6).toFixed(1);
        num = num.replace(/\.0$/, '');
        return num + 'M';
    } else if (number >= 1e4) {
        // 一万以上，不保留小数
        let num = (number / 1e3).toFixed(0);
        return num + 'K';
    } else if (number >= 1e3) {
        // 一千以上，保留一位小数
        let num = (number / 1e3).toFixed(1);
        num = num.replace(/\.0$/, '');
        return num + 'K';
    } else {
        // 小于一千，不保留小数
        return number.toString();
    }
}

export const getRelativeTime = ($createdAt) => {
    const dateObj = new Date($createdAt);
    const now = new Date();

    const diffInMs = now - dateObj; // 时间差，单位为毫秒
    let diffInMinutes = Math.floor(diffInMs / (1000 * 60)); // 转换为分钟
    let diffInHours = Math.floor(diffInMinutes / 60); // 转换为小时
    let diffInDays = Math.floor(diffInHours / 24); // 转换为天
    let diffInWeeks = Math.floor(diffInDays / 7); // 转换为星期
    let diffInMonths = Math.floor(diffInDays / 30); // 粗略转换为月
    let diffInYears = Math.floor(diffInDays / 365); // 粗略转换为年

    if (diffInMinutes < 60) {
        return `${diffInMinutes || 1} min ago`; // 如果为0，则返回1
    } else if (diffInHours < 24) {
        return `${diffInHours || 1} h ago`; // 如果为0，则返回1
    } else if (diffInDays < 7) {
        return `${diffInDays || 1} d ago`; // 如果为0，则返回1
    } else if (diffInWeeks < 4) {
        return `${diffInWeeks || 1} wk ago`; // 如果为0，则返回1
    } else if (diffInMonths < 12) {
        return `${diffInMonths || 1} mo ago`; // 如果为0，则返回1
    } else {
        return `${diffInYears || 1} y ago`; // 如果为0，则返回1
    }
};
