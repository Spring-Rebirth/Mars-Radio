// utils/numberFormatter.js
export function formatNumberWithUnits(number, t) {
    if (number >= 1e9) {
        let num = (number / 1e9).toFixed(1);
        num = num.replace(/\.0$/, '');
        return num + t('B');
    } else if (number >= 1e6) {
        let num = (number / 1e6).toFixed(1);
        num = num.replace(/\.0$/, '');
        return num + t('M');
    } else if (number >= 1e4) {
        let num = (number / 1e3).toFixed(0);
        return num + t('K');
    } else if (number >= 1e3) {
        let num = (number / 1e3).toFixed(1);
        num = num.replace(/\.0$/, '');
        return num + t('K');
    } else {
        return number.toString();
    }
}

export const getRelativeTime = ($createdAt, t) => {
    const dateObj = new Date($createdAt);
    const now = new Date();

    const diffInMs = now - dateObj;
    let diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    let diffInHours = Math.floor(diffInMinutes / 60);
    let diffInDays = Math.floor(diffInHours / 24);
    let diffInWeeks = Math.floor(diffInDays / 7);
    let diffInMonths = Math.floor(diffInDays / 30);
    let diffInYears = Math.floor(diffInDays / 365);

    if (diffInMinutes < 60) {
        return `${diffInMinutes || 1} ${t('min ago')}`;
    } else if (diffInHours < 24) {
        return `${diffInHours || 1} ${t('h ago')}`;
    } else if (diffInDays < 7) {
        return `${diffInDays || 1} ${t('d ago')}`;
    } else if (diffInWeeks < 4) {
        return `${diffInWeeks || 1} ${t('wk ago')}`;
    } else if (diffInMonths < 12) {
        return `${diffInMonths || 1} ${t('mo ago')}`;
    } else {
        return `${diffInYears || 1} ${t('yr ago')}`;
    }
};

