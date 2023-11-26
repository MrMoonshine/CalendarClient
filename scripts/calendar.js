function number2strpad(num, len){
    num = num.toString();
    num = num.padStart(len, "0");
    return num;
}

class Calendar{
    static COOKIE_NAME = "calendars";
    static COUNTER = 0;

    static PARENT = document.getElementById("calendarselection") ?? document.body;
    
    constructor(url, name, user="", passwd="", color = "", hidden = false){
        this.url = url;
        this.name = name;
        this.user = user;
        this.passwd = passwd;
        this.hidden = hidden;
        this.color = color;
        this.id = Calendar.COUNTER++;
        this.buildDOM();

        // API URL build
        const API_REMOVE_SUFFIX = "index.php";
        this.api = new URL(window.location);
        if(this.api.pathname.endsWith(API_REMOVE_SUFFIX)){
            this.api.pathname = this.api.pathname.substring(
                0,
                this.api.pathname.length - API_REMOVE_SUFFIX.length
            );
        }
        this.api.pathname += "calendar.php";
    }

    setColor(color){
        this.color = color;
        this.colordisplay.style.backgroundColor = this.color;
    }
    /*
        @brief Fetch data from DAViCal server via the php backend
        @param bounds [Date, Date] interval for calendar search
    */
    update(bounds){
        //console.log(Calendar.date2iCal(bounds[0]));
        //console.log(Calendar.date2iCal(bounds[1]));
        this.api.searchParams.append("calendar", this.url);
        this.api.searchParams.append("start", Calendar.date2iCal(bounds[0]));
        this.api.searchParams.append("end", Calendar.date2iCal(bounds[1]));
        
        let req = new XMLHttpRequest();
        req.addEventListener("load", (e) => {
            console.log(e.originalTarget.responseText);
        });

        req.open("GET", this.api);
        req.send();
    }
    /*
        Building DOM for the calendar to select, hide & edit it
    */
    buildDOM(){
        let container = document.createElement("div");
        container.classList.add("calendarselector");
        container.classList.add("d-flex");

        let title = document.createElement("span");
        title.classList.add("title");
        title.innerHTML = this.name;

        this.colordisplay = document.createElement("span");
        this.colordisplay.classList.add("colordisplay");
        this.setColor(this.color);

        container.appendChild(title);
        container.appendChild(this.colordisplay);
        Calendar.PARENT.appendChild(container);
    }

    static fromList(clist){
        console.log(clist.calendars);
        let ret = [];
        if(clist.error != 0){
            console.error(clist.error_message);
            return ret;
        }

        (clist.calendars ?? []).forEach(cal => {
            let obj = new Calendar(cal.URL, cal.name);
            obj.setColor(cal.color);
            ret.push(obj);
        });
        return ret;
    }
    // maes a date UTC+0 and converts to yyyymmddThhmmssZ
    static date2iCal(date){
        let out = number2strpad(date.getUTCFullYear(), 4);
        out += number2strpad(date.getUTCMonth() + 1, 2);
        out += number2strpad(date.getUTCDate(), 2);
        out += "T";
        out += number2strpad(date.getUTCHours(), 2);
        out += number2strpad(date.getUTCMinutes(), 2);
        out += number2strpad(date.getUTCSeconds(), 2);
        out += "Z";
        return out;
    }
}