function number2strpad(num, len){
    num = num.toString();
    num = num.padStart(len, "0");
    return num;
}

class Appointment{
    constructor(parent, raw){
        this.calendar = parent;
        this.href = raw.href;
        this.etag = raw.etag;
        this.data = raw.data;

        // Parsing ICAL data
        this.data = this.data.replace("Vienna", "Istanbul"); //Timezone lab
        console.log(this.data);
        var jcalData = ICAL.parse(this.data);
        var vcalendar = new ICAL.Component(jcalData);
        var vevent = vcalendar.getFirstSubcomponent('vevent');
    
        this.summary = vevent.getFirstPropertyValue('summary');
        this.description = vevent.getFirstPropertyValue('description');
        // Get Times
        this.dtstart = Appointment.getDateFromProperty(
            vevent.getFirstProperty('dtstart')
        );
        this.dtend = Appointment.getDateFromProperty(
            vevent.getFirstProperty('dtend')
        );
        this.dtstamp = Appointment.getDateFromProperty(
            vevent.getFirstProperty('dtstamp')
        );
        // Validate calendar
        this.valid = this.dtstart && this.dtend;
        this.error_message = "";
        if(this.valid){
            this.valid &&= this.dtstart < this.dtend;
            this.error_message = "End before Start";
        }else{
            this.error_message = "DTSTART or DTEND is absent!"; 
        }
    }
    // Returns UTC offset in milliseconds
    // If no name, calculate UTC-diff to local timezone
    static getTimezoneOffset(name = null){
        //console.log(name);
        let now = new Date();

        let date0 = new Date(now.toLocaleString("en", {timeZone: "UTC"}));
        let date1 = name ? new Date(now.toLocaleString("en", {timeZone: name})) : structuredClone(now);

        //console.log("UTC: " + date0.toLocaleString("de", {timeZone: "UTC"}) + " compared to "+ name +":" + date1.toLocaleString("de", {timeZone: "UTC"}));
        return date1.getTime() - date0.getTime();
    }

    static getDateFromProperty(prop){
        let jCal = prop.jCal;
        if(!jCal){
            return null;
        }
        if(jCal.length < 3){
            return null;
        }

        let name = jCal[0];     // Name of the prperty
        let meta = jCal[1];     // contains the tzid variable in case a timezone is set
        let type = jCal[2];     // Type of the prop
        let value = jCal[3];    // Value

        let date = new Date(value);
        if(meta.tzid){
            if(!value.endsWith("Z")){
                value += "Z";
            }
            let offset = Appointment.getTimezoneOffset(meta.tzid);
            let localOffset = Appointment.getTimezoneOffset();
            // Calculate the Offset to the date
            date = new Date(date.getTime() - (offset - localOffset));
        }else{
            // No timezone provided, fall back to UTC
            date = new Date(date.toLocaleString("en", {timeZone: "UTC"}));
        }
        
        console.log(name + ": " + date.toLocaleString("de"));
        return date;
    }
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
        this.appointments = [];
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
        @param callback(Calendar calendar, String data) function used to populate a calendar table by providing raw data of an appointment
    */
    update(bounds, callback){
        //console.log(Calendar.date2iCal(bounds[0]));
        //console.log(Calendar.date2iCal(bounds[1]));
        this.spinner.style.display = "unset";
        this.api.searchParams.append("calendar", this.url);
        this.api.searchParams.append("start", Calendar.date2iCal(bounds[0]));
        this.api.searchParams.append("end", Calendar.date2iCal(bounds[1]));
        
        let req = new XMLHttpRequest();
        req.addEventListener("load", (e) => {
            this.setError();
            // Checking HTTP status
            if(e.originalTarget.status != 200){
                let msg = e.originalTarget.status + " " + e.originalTarget.statusText;
                console.error(msg);
                this.setError(msg);
                return;
            }
            let data = JSON.parse(e.originalTarget.responseText);
            // Check data status
            if(data.error != 0){
                let msg = "Error: " + data.error_message + "!";
                console.error(msg);
                this.setError(msg);
                return;
            }
            // add appointments
            data.events.forEach(appointment => {
                this.appointments.push(new Appointment(this, appointment));
                //callback(this, appointment);
            });
            this.spinner.style.display = "none";
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

        this.titledisplay = document.createElement("span");
        this.titledisplay.classList.add("title");
        this.titledisplay.innerHTML = this.name;

        this.colordisplay = document.createElement("span");
        this.colordisplay.classList.add("colordisplay");
        this.setColor(this.color);

        this.spinner = document.createElement("span");
        this.spinner.classList.add("spinner");
        this.spinner.style.display = "none";

        container.appendChild(this.titledisplay);
        container.appendChild(this.spinner);
        container.appendChild(this.colordisplay);

        this.errordisplay = document.createElement("code");
        this.errordisplay.classList.add("errordisplay");
        this.setError();

        Calendar.PARENT.appendChild(container);
        Calendar.PARENT.appendChild(this.errordisplay);
    }

    // Sets the error message. If no parameter is set, clear it
    setError(text = ""){
        const ERROR_CLASS = "error-text";
        
        this.errordisplay.innerHTML = text;
        if(text.length < 1){
            this.errordisplay.style.display = "none";
            this.titledisplay.classList.remove(ERROR_CLASS);
            return;
        }        
        this.errordisplay.style.display = "unset";
        this.titledisplay.classList.add(ERROR_CLASS);
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
    // makes a date UTC+0 and converts to yyyymmddThhmmssZ
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