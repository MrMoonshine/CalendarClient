class Calendar{
    static COOKIE_NAME = "calendars";
    static COLOR_COUNT = 8;
    static COUNTER = 0;
    constructor(name, url, user="", passwd="", color = "", hidden = false){
        this.name = name,
        this.url = url;
        this.user = user;
        this.passwd = passwd;
        this.hidden = hidden;
        this.color = color;
        this.id = Calendar.COUNTER++;
        if(this.color.length == 0){
            // Cycle through default colors if none are set
            this.color = (this.id) % Calendar.COLOR_COUNT;
        }
    }
    // Saves an array of calendars
    static saveLocal(arr){
        localStorage.setItem(Calendar.COOKIE_NAME, arr);
    }
    // Loads calendars from local storage
    static loadLocal(){
        // Get default calendars if none are set.
        if (localStorage.getItem(Calendar.COOKIE_NAME) === null) {
            let arr = [];
            arr.push(new Calendar("Personal", ""));
            if(!CONFIG.subscribe_default){
                return arr;
            }

            CONFIG.subscribe_default.forEach(calendar => {
                if(calendar.url){
                    if(calendar.url.length > 0){
                        arr.push(new Calendar(calendar.name ?? "Calendar", calendar.url));
                    }
                }
            });
            return arr;
        }
    }
}

console.log(Calendar.loadLocal());