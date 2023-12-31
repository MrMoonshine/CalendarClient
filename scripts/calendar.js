class Common{
    static MS_SEC = 1000;
    static MS_MIN = Common.MS_SEC * 60;
    static MS_HOUR = Common.MS_MIN * 60;
    static MS_DAY = Common.MS_HOUR * 24;

    static SUNDAY = 0;
    static MONDAY = 1;
    static TUESDAY = 2;
    static WEDNESDAY = 3;
    static THURSDAY = 4;
    static FRIDAY = 5;
    static SATURDAY = 6;

    static hide(dom){
        dom.classList.add("hidden");
    }

    static show(dom){
        dom.classList.remove("hidden");
    }

    static number2strpad(num, len){
        num = num.toString();
        num = num.padStart(len, "0");
        return num;
    }

    static sameDay(date1_i, date2_i){
        let date1 = structuredClone(date1_i);
        let date2 = structuredClone(date2_i);
        return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
    }

    static addDays(date, days){
        return new Date(date.getTime() + days * Common.MS_DAY);
    }

    static addMonth(date, months){
        let datec = structuredClone(date);
        let m = datec.getMonth();
        let msum = m + months;
        datec.setMonth(msum % 12);
        datec = Common.addYear(datec, Math.floor(msum/12));
        return datec;
    }

    static addYear(date, years){
        let datec = structuredClone(date);
        datec.setFullYear(datec.getFullYear() + years);
        return datec;
    }

    static timeSet0(date_i){
        let date = structuredClone(date_i);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    static round(number, lead){
        const pot = Math.pow(10, lead);
        return Math.round(pot*number)/pot;
    }
}

class AppointmentPart {
    element;
    constructor(wholeDay, start, end, appointment) {
      this.element = document.createElement("div");
      this.element.classList.add("appointment");
      this.element.classList.add("shine");
      this.start = start;
      this.end = end;
      this.wholeDay = wholeDay;
      this.track = 0;
      this.appointment = appointment;
    }

    get dom(){
        return this.element;
    }
     
    get etag(){
        return this.appointment.etag;
    }

    clear(){
        this.dom.remove();
    }

    setTrack(track) {
        this.track = track;
    }

    setCSS(trackcount){
        this.dom.style.width = "calc((100% - var(--appointment-radius))/" + (trackcount + 1) + ")";
        this.dom.style.left = "calc(100% * " + this.track / (trackcount + 1) + ")";
    }

    open(cssclass, enable){
        if(enable){
            this.dom.classList.add(cssclass);
        }else{
            this.dom.classList.remove(cssclass);
        }
    }

    openBottom(enable = true){
        this.open("openbottom", enable);
    }

    openTop(enable = true){
        this.open("opentop", enable);
    }
  
    static overlap(a, b, trackIgnore = false) {
      if (a.appointment.hidden || a.appointment.hidden) {
        return false;
      }
  
      if (!trackIgnore && a.track != b.track) {
        return false;
      }
  
      if (a.wholeDay || b.wholeDay || b.etag == a.etag) {
        return false;
      }
      return (
        (b.start >= a.start && b.start <= a.end) ||
        (b.end >= a.start && b.end <= a.end)
      );
    }
  
    static overlapCount(m, list, trackIgnore = false) {
      let counter = 0;
      list.forEach((elem) => {
        counter += AppointmentPart.overlap(m, elem, trackIgnore) ? 1 : 0;
      });
      return counter;
    }

    static getOverlaps(m, list, trackIgnore = false){
        let retval = [];
        list.forEach((elem) => {
            if(AppointmentPart.overlap(m, elem, trackIgnore)){
                retval.push(elem);
            }
        });
        return retval;
    }
  }

class Appointment{
    parts;
    constructor(parent, raw){
        this.calendar = parent;
        this.href = raw.href;
        this.etag = raw.etag;
        this.data = raw.data;

        this.parts = [];

        // Parsing ICAL data
        //this.data = this.data.replace("Vienna", "Istanbul"); //Timezone lab
        //console.log(this.data);
        var jcalData = ICAL.parse(this.data);
        var vcalendar = new ICAL.Component(jcalData);
        var vevent = vcalendar.getFirstSubcomponent('vevent');
        //console.log(vevent);
    
        this.summary = vevent.getFirstPropertyValue('summary');
        this.description = vevent.getFirstPropertyValue('description');
        this.rrule = vevent.getFirstPropertyValue('rrule');
    
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
            // correction to whole-day if at least DTSTART is set
            if(this.dtstart){
                this.dtstart = Common.timeSet0(this.dtstart);
                this.dtend = Common.addDays(this.dtstart, 1);
                this.valid = true;
                //console.log("Corrected to " + this.dtstart);
            }
            this.error_message = "DTSTART or DTEND is absent!"; 
        }
        //console.log("Appointment is valid: " + this.valid);
        this.dtstartOriginal = structuredClone(this.dtstart);
        this.dtendOriginal = structuredClone(this.dtend);
        this.counter = 0;       // Count of drawn iterations
        this.enable = true;     // Should this iteration be drawn?
    }

    durationH(){
        return (this.dtend.getTime() - this.dtstart.getTime())/Common.MS_HOUR;
    }

    /*
        @brief checks if the appointment last a whole day
        @returns true if whole day
    */
    wholeDay(){
        let deltah = this.durationH();
        // check if duration is ok
        if(deltah % 24){
            return false;
        }
        // check if it starts at 00:00:00
        return this.dtstart.getHours() == 0 && this.dtstart.getMinutes() == 0;
    }

    show(){
        this.dom.forEach(Common.show);
    }

    hide(){
        this.dom.forEach(Common.hide);
    }

    clear(){
        this.parts.forEach((p) => p.clear())
        this.parts = [];
    }

    addToTable(table){
        if (!this.valid) {
            console.error(
              "Invalid appointment " +
                (this.summary ?? " ERROR ") +
                this.error_message
            );
            return;
        }
        let interval = table.getDateInterval();
        this.rewind();  // Reset in case of repeating event
        do{
            if (!this.enable) {
                continue;
              }
        
              let cell = table.getCell(this.dtstart);
              let current = Common.timeSet0(this.dtstart);
              let wholeDay = this.wholeDay();

              while (Common.timeSet0(current) <= Common.timeSet0(this.dtend)) {
                let firstDay = Common.sameDay(this.dtstart, current);
                let start = firstDay ? this.dtstart : Common.timeSet0(current);
                let end = this.dtend;
                let lastDay = Common.sameDay(current, end);
                if (!lastDay) {
                  end = structuredClone(current);
                  end.setHours(23, 59, 59);
                }
        
                let deltah = (end.getTime() - start.getTime()) / Common.MS_HOUR;
                deltah = Common.round(deltah, 2);
                //console.log(this.summary + " part has " + deltah + " hours");
                if (
                  deltah <= 0 ||
                  current >= Common.addDays(table.start, table.dayCount)
                ) {
                  // remove unnessesary stub
                  break;
                }
        
                let eventPart = new AppointmentPart(
                  wholeDay,
                  start,
                  end,
                  this
                );
                this.parts.push(eventPart);
                table.events.push(eventPart);
        
                // content
                if (table.dayCount < 30) {
                  let b = document.createElement("b");
                  eventPart.dom.appendChild(b);
                  b.innerHTML = this.summary;
                  // Add a repeating icon in case it is
                  if(this.isRepeating()){
                    b.innerHTML += " &#x21BB;";
                  }
                  /*let p = document.createElement("p");
                  p.innerHTML += "von: " + this.dtstart.toLocaleString("de");
                  p.innerHTML += "<br>bis: " + this.dtend.toLocaleString("de");
                  eventPart.dom.appendChild(p);*/
                  if (!wholeDay) {
                    // make this style open in case it goes over date line
                    eventPart.openTop(!Common.sameDay(this.dtstart, current));
                    eventPart.openBottom(!Common.sameDay(this.dtend, current));
                    // Calcuate height for entry
                    eventPart.dom.style.height =
                      "calc(" + 100 * deltah + "% +  var(--appointment-radius))";
        
                    // Overlap handling
                    /*while (
                        AppointmentPart.overlapCount(eventPart, table.events) &&
                      eventPart.track < CalendarTable.DAV_VIEW_MAX_TRACKS
                    ) {
                      console.log(this.summary + " overlaps");
                      eventPart.setTrack(eventPart.track + 1);
                    }*/
                    //table.events.push(eventPart);
                  }
        
                  let startcell = table.getCell(start, wholeDay);
                  if (!startcell) {
                    current = Common.addDays(current, 1);
                    continue;
                  }

                  // Get the diff of start and cell in hours
                  let deltastart =
                    (start.getTime() - startcell.start.getTime()) / Common.MS_HOUR;
                    eventPart.dom.style.top = Math.round(100 * deltastart) + "%";
                  startcell.dom.appendChild(eventPart.dom);
                } else {
                  let cell = table.getCell(start, wholeDay);
                  if (!cell) {
                    current = Common.addDays(current, 1);
                    continue;
                  }
                  // Month View
                  if (!wholeDay) {
                    let b = document.createElement("b");
                    // Arrows
                    if (firstDay && !lastDay) {
                      b.innerHTML += "&#x21A6;";
                    } else if (!firstDay && lastDay) {
                      b.innerHTML += "&#x21E5;";
                    } else if (!firstDay && !lastDay) {
                      b.innerHTML += "&#x27F7;";
                    }
        
                    if (firstDay) {
                      b.innerHTML += start.toLocaleString("default", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                    } else if (lastDay) {
                      b.innerHTML += this.dtend.toLocaleString("default", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                    }
                    eventPart.dom.appendChild(b);
                  }
        
                  eventPart.dom.innerHTML += " " + this.summary;
                  cell.dom.appendChild(eventPart.dom);
                }
        
                eventPart.dom.style.backgroundColor = this.calendar.color;
                eventPart.dom.classList.add("calendar" + this.calendar.id);
                current = Common.addDays(current, 1);
              }
        }while(
            this.calculateNext() &&
            this.dtstart <=
            Common.addDays(table.start, table.getActualDayCount())
        );  // handle recurring

    }

    isRepeating(){
        if(!this.rrule){
            return false;
        }
        // an rrule has been set
        if(!this.rrule.freq){
            return false;
        }

        if(this.rrule.counter){
            if(this.rrule.counter <= this.counter){
                return false;
            }
        }
        return true;
    }

    /*
        @brief calculates dtstart and dtend for the next occurance if it is a repeating event.
        @returns true if there is a next one, false if there is not
    */
    calculateNext(){
        if(!this.isRepeating()){
            return false;
        }

        let interval = this.rrule.interval ?? 1;

        switch(this.rrule.freq){
            case "DAILY":
                this.dtstart = Common.addDays(this.dtstart, interval);
                this.dtend = Common.addDays(this.dtend, interval);
                break;
            case "WEEKLY":
                this.dtstart = Common.addDays(this.dtstart, 7*interval);
                this.dtend = Common.addDays(this.dtend, 7*interval);
                break;
            case "MONTHLY":
                this.dtstart = Common.addMonth(this.dtstart, interval);
                this.dtend = Common.addMonth(this.dtend, interval);
                break;
            case "YEARLY":
                this.dtstart = Common.addYear(this.dtstart, interval);
                this.dtend = Common.addYear(this.dtend, interval);
                break;
            default:
                return false;
                break;
        }

        if(this.rrule.until){
            //console.log(this.rrule.until.toJSDate());
            if(this.dtstart > this.rrule.until.toJSDate()){
                return false;
            }
        }
        this.enable = true;

        if(this.rrule.parts){
            if(this.rrule.parts.BYDAY){
                //console.log(this.data);
                let matches = 0;
                const weekdays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
                //console.log("Start day is " + this.dtstart.getDay() + " - " + this.dtstart.toLocaleString("default", {weekday: "long"}) + " ||| " + this.dtstart.toLocaleString());
                //console.log(this.rrule.parts.BYDAY);
                this.rrule.parts.BYDAY.forEach(element => {
                    if(weekdays[this.dtstart.getDay() % 7] == element){
                        matches++;
                    }
                });
                if(matches < 1){
                    this.enable = false;
                }
            }
        }
        this.counter++;
        return true;
    }

    rewind(){
        this.dtstart = structuredClone(this.dtstartOriginal);
        this.dtend = structuredClone(this.dtendOriginal);
        this.counter = 0;       // Count of drawn iterations
        this.enable = true;     // Should this iteration be drawn?
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
        if(!prop){
            return null;
        }
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
        
        //console.log(name + ": " + date.toLocaleString("de"));
        return date;
    }
}

class Calendar{
    static COOKIE_NAME = "calendars";
    static COUNTER = 0;

    static PARENT = document.getElementById("calendarselection") ?? document.body;
    
    dialog;

    constructor(url, name, color = "", hidden = false, user="", passwd=""){
        this.url = url;
        this.name = name;
        this.user = user;
        this.passwd = passwd;
        this.hidden = hidden;
        this.color = color;

        this.appointments = [];
        
        this.id = Calendar.COUNTER++;
        this.buildDialog();
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

    clearAppointments(){
        this.appointments.forEach((a) => a.clear());
        this.appointments = [];
    }
    /*
        @brief Fetch data from DAViCal server via the php backend
        @param table table object
    */
    update(table){
        table.events = [];
        let bounds = table.getDateInterval();
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
            this.clearAppointments();
            // add appointments
            data.events.forEach(elem => {
                //callback(parent, new Appointment(this, elem));
                this.appointments.push(new Appointment(this, elem));
            });
            this.spinner.style.display = "none";
        });

        req.addEventListener("loadend", () => {
            this.addToTable(table);
            table.arrangeTracks();
        });

        req.open("GET", this.api);
        req.send();
    }

    addToTable(table){
        this.appointments.forEach((a) => a.addToTable(table));
    }

    setColor(color){
        this.color = color;
        this.colordisplay.style.backgroundColor = this.color;
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

        this.titledisplay.style.cursor = "pointer";
        this.titledisplay.addEventListener("click", () => {
            this.dialog.showModal();
        });

        this.colordisplay = document.createElement("span");
        this.colordisplay.classList.add("colordisplay");
        this.setColor(this.color);

        this.spinner = document.createElement("span");
        this.spinner.classList.add("spinner");
        this.spinner.style.display = "none";

        /* Hidden or not checkbox */
        let cbid = "cal-hide-cb-" + this.id;
        let label = document.createElement("label");
        label.classList.add("check-container");
        label.setAttribute("for", cbid);
        this.cb = document.createElement("input");
        this.cb.setAttribute("type", "checkbox");
        this.cb.id = cbid;
        let cm = document.createElement("span");
        cm.classList.add("checkmark");
        if(!this.hidden){
            this.cb.setAttribute("checked", true);
        }
        this.cb.addEventListener("change", () => {
            this.hidden = !this.hidden;
            let appoi = document.querySelectorAll(".appointment.calendar" + this.id);
            appoi.forEach(a => {
                if(this.hidden){
                    a.classList.add("hidden");
                }else{
                    a.classList.remove("hidden");
                }
            });
        });

        label.appendChild(this.cb);
        label.appendChild(cm);

        container.appendChild(this.titledisplay);
        container.appendChild(this.spinner);
        container.appendChild(this.colordisplay);
        container.appendChild(label);

        this.errordisplay = document.createElement("code");
        this.errordisplay.classList.add("errordisplay");
        this.setError();

        Calendar.PARENT.appendChild(container);
        Calendar.PARENT.appendChild(this.errordisplay);
    }

    buildDialog(){
        this.dialog = document.createElement("dialog");

        let h = document.createElement("h3");
        h.innerHTML = "Edit calendar <i>" + this.name + "</i>";
        this.dialog.appendChild(h);

        let form = document.createElement("form");
        form.setAttribute("method", "POST");

        let closer = document.createElement("button");
        closer.setAttribute("type", "button");
        closer.classList.add("close");
        closer.innerHTML = '<span aria-hidden="true">&times;</span>';
        closer.addEventListener("click", () => {
            this.dialog.close();
        });
        this.dialog.appendChild(closer);
        let label1 = document.createElement("label");
        label1.innerHTML = "Display Name";
        let idn = document.createElement("input");
        idn.setAttribute("type", "text");
        idn.name = "displayname";
        idn.value = this.name;
        form.appendChild(label1);
        form.appendChild(idn);

        let label2 = document.createElement("label");
        label2.innerHTML = "Color";

        let icolor = document.createElement("input");
        icolor.setAttribute("type", "color");
        icolor.name = "color";
        icolor.value = this.color;

        form.appendChild(label2);
        form.appendChild(icolor);

        let submit = document.createElement("input");
        submit.setAttribute("type", "submit");

        let bexit = document.createElement("button");
        bexit.setAttribute("type", "button");
        bexit.innerHTML = "Cancel";

        let container = document.createElement("div");
        container.classList.add("d-flex");
        container.appendChild(submit);
        container.appendChild(bexit);
        form.appendChild(container);

        let url = document.createElement("input");
        url.classList.add("hidden");
        url.value = this.url;
        url.name = "url";
        form.appendChild(url);

        this.dialog.appendChild(form);
        document.body.appendChild(this.dialog);
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
            let obj = new Calendar(cal.URL, cal.name, cal.color);
            ret.push(obj);
        });
        return ret;
    }
    // makes a date UTC+0 and converts to yyyymmddThhmmssZ
    static date2iCal(date){
        let out = Common.number2strpad(date.getUTCFullYear(), 4);
        out += Common.number2strpad(date.getUTCMonth() + 1, 2);
        out += Common.number2strpad(date.getUTCDate(), 2);
        out += "T";
        out += Common.number2strpad(date.getUTCHours(), 2);
        out += Common.number2strpad(date.getUTCMinutes(), 2);
        out += Common.number2strpad(date.getUTCSeconds(), 2);
        out += "Z";
        return out;
    }
}