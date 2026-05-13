function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level));
}

function levelFromXp(xp) {
    let level = 0;
    while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level++;
    }
    return level;
}

function xpProgress(totalXp) {
    let level = 0;
    let remaining = totalXp;
    while (remaining >= xpForLevel(level)) {
        remaining -= xpForLevel(level);
        level++;
    }
    return { level, current: remaining, needed: xpForLevel(level) };
}

module.exports = { xpForLevel, levelFromXp, xpProgress };