String.prototype.hashCode = function(seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < this.length; i++) {
        ch = this.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

module.exports = {
    getCookie(cookies, cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(cookies);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return undefined;
    },

    cookieIs(cookies, cname, cvalue) {
        let cookie = module.exports.getCookie(cookies, cname);
        if (cookie == cvalue.hashCode()) return true;
        return false;
    },

    setCookie(cookies, cname, cvalue, nohash) {
        if (nohash == undefined) cvalue = cvalue.hashCode();
        cookies = cname + "=" + cvalue + ";path=/";
        console.log("cookie changed!")
    }
}