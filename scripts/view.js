class CalendarTableCell {
    td;
    // start date & duration in h
    constructor(start, duration) {
        this.td = document.createElement("td");
        this.start = structuredClone(start);
        this.start.setSeconds(0);
        this.start.setMilliseconds(0);
        this.duration = duration;
    }

    get dom() {
        return this.td;
    }

    static compare(a, b) {
        if (a.start < b.start) {
            return -1;
        } else if (a.start > b.start) {
            return 1;
        } {
            return 0;
        }
    }
}

class CalendarTableEventPart{
    constructor(dom, wholeDay, start, end){
        this.dom = dom;
        this.start = start;
        this.end = end;
        this.wholeDay = wholeDay;
        this.track = 0;
    }

    setTrack(track){
        this.track = track;
    }

    static overlap(a, b, trackIgnore = false){
        if(!trackIgnore && a.track != b.track){
            return false;
        }

        if(a.wholeDay || b.wholeDay || b == a){
            return false;
        }
        return (b.start >= a.start && b.start <= a.end ||
            b.end >= a.start && b.end <= a.end);
    }

    static overlapCount(m, list, trackIgnore = false){
        let counter = 0;
        list.forEach(elem => {
            counter += CalendarTableEventPart.overlap(m, elem, trackIgnore) ? 1 : 0;
        });
        return counter;
    }
}

class CalendarTable {
    table;
    static WEEK_COUNT_MONTH_VIEW = 6;
    static DAV_VIEW_MAX_TRACKS = 5;
    static monthWidget = document.getElementById("month-widget");

    constructor(days, start = null) {
        this.cells = [];
        this.dayCount = days;      // Number of days
        // Correct start date, in case of week or month view
        this.start = this.getStartDate(start ?? new Date());
        this.table = document.createElement("table");
        this.thead = document.createElement("thead");
        this.tbody = document.createElement("tbody");
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
        this.setDays(this.dayCount);

        this.evtParts = [];
        this.calendarCount = 0;
        this.counter = 0;
    }

    setDays(days, start = null) {
        if (start) {
            this.start = start;
        }
        this.cells = [];
        this.evtParts = [];
        this.counter = 0;
        this.dayCount = parseInt(days);
        this.clear();
        let trh = document.createElement("tr");
        this.thead.appendChild(trh);
        this.table.classList.remove("month");

        // Check if there should be a month table made
        if (this.dayCount < 30) {
            this.monthWidgetHide();
            this.start = this.getStartDate(this.start ?? new Date());
            // include an empty one for the clock on the left side
            trh.appendChild(document.createElement("th"));
            for (let i = 0; i < this.dayCount; i++) {
                let th = document.createElement("th");
                let date = new Date(this.start.getTime() + Common.MS_DAY * i);
                // format date
                th.innerHTML = date.toLocaleString('default', { weekday: "short", day: "numeric", month: 'short' });
                trh.appendChild(th);
            }
            // Get start date
            let date = new Date(this.start);
            date.setMinutes(0);
            date.setHours(0);
            // For whole-day appoinments
            let trwd = document.createElement("tr");
            trwd.classList.add("whole-days");
            trwd.appendChild(document.createElement("td")); // Empty element for time col
            for (let i = 0; i < this.dayCount; i++) {
                let cell = new CalendarTableCell(
                    Common.addDays(date, i),
                    24
                );
                this.cells.push(cell);
                trwd.appendChild(cell.dom);
            }
            this.tbody.appendChild(trwd);
            // A row for each hour of the day
            for (let i = 0; i < 24; i++) {
                let dateth = document.createElement("th");
                dateth.classList.add("time");
                dateth.innerHTML = date.toLocaleString('default', { hour: "2-digit", minute: "2-digit", hour12: false });

                let tr = document.createElement("tr");
                tr.appendChild(dateth);
                for (let i = 0; i < this.dayCount; i++) {
                    let cell = new CalendarTableCell(
                        Common.addDays(date, i),
                        1
                    );
                    tr.appendChild(cell.dom);
                    this.cells.push(cell);
                }
                this.tbody.appendChild(tr);
                date = new Date(date.getTime() + Common.MS_HOUR);
            }
        } else {
            /*
                Month Table
            */
            this.start = this.getStartDate(this.start ?? new Date());
            this.table.classList.add("month");
            // jump at least a week ahead to be in the current month
            let month_date = new Date(this.start.getTime() + Common.MS_DAY * 7);
            let month = month_date.getMonth();
            //console.log(this.start);
            // Display current month and year
            this.monthWidgetShow(month_date.toLocaleString("default", {
                month: "long",
                year: "numeric"
            }));
            // For each week day
            for (let i = 0; i < 7; i++) {
                let th = document.createElement("th");
                let date = new Date(this.start.getTime() + Common.MS_DAY * i);
                // format date
                th.innerHTML = date.toLocaleString('default', { weekday: "long" });
                trh.appendChild(th);
            }
            /*
                Days
            */
            for (let i = 0; i < CalendarTable.WEEK_COUNT_MONTH_VIEW; i++) {
                let tr = document.createElement("tr");
                this.tbody.appendChild(tr);
                // for each day of the week
                for (let d = 0; d < 7; d++) {
                    let number = document.createElement("number");
                    let day = new Date(this.start.getTime() + Common.MS_DAY * (i * 7 + d));
                    let cell = new CalendarTableCell(day, 24);
                    this.cells.push(cell);

                    number.innerHTML = day.getDate();
                    // if the day is not in the shown month
                    if (day.getMonth() != month) {
                        cell.dom.classList.add("shade");
                    }
                    cell.dom.appendChild(number);
                    tr.appendChild(cell.dom);
                }
            }
        }
        // Sort the table
        this.cells.sort(CalendarTableCell.compare);
        /*console.log("Lenght " + this.cells.length);
        this.cells.forEach(elem => {
            console.log(elem.start.toLocaleString("de"));
        });*/
    }
    /*
        @brief get the cell for a given date
        @param date The date
        @param wholeDay only allow fields with 24h duration
        @return td element
    */
    getCell(date, wholeDay = false) {
        const start = this.cells.length - 1;
        let ret = this.cells[start];
        let datec = structuredClone(date);
        //datec.setSeconds(datec.getSeconds() + 1);

        for (let i = start; i >= 0; i--) {
            let ret = this.cells[i];
            if(this.dayCount < 30){
                if (
                    // only allow 1h cells if not the whole day is needed
                    ret.start <= date && ret.duration < 24 && !wholeDay ||
                    ret.start <= date && ret.duration == 24 && wholeDay
                ) {
                    //console.log(ret.start.toLocaleString("de") + " <= " + date.toLocaleString("de"));
                    return ret;
                }
            }else{
                if(Common.sameDay(ret.start, date)){
                    return ret;
                }
            }
        }
        return ret;
    }

    static addEvent(parent, appointment) {
        /*          +--------------------------------------+
                    |                                      |
                    |    Creating DIVs for Appointments    |
                    |                                      |
                    +--------------------------------------+    */
        let cell = parent.getCell(appointment.dtstart);

        let current = structuredClone(appointment.dtstart);
        current = Common.timeSet0(current);
        let wholeDay = appointment.wholeDay();
        console.log("Adding " + appointment.summary);

        // Step forward a day each time, until the end day is reached.
        while (Common.timeSet0(current) <= Common.timeSet0(appointment.dtend)) {
            let firstDay = Common.sameDay(appointment.dtstart, current);
            let start = firstDay ? appointment.dtstart : Common.timeSet0(current);
            let end = appointment.dtend;
            let lastDay = Common.sameDay(current, end);
            if (!lastDay){
                end = structuredClone(current);
                end.setHours(23, 59, 59);
            }

            let deltah = (end.getTime() - start.getTime()) / Common.MS_HOUR;
            deltah = Common.round(deltah, 2);
            //console.log(appointment.summary + " part has " + deltah + " hours");
            if (
                deltah <= 0 ||
                current >= Common.addDays(parent.start, parent.dayCount)
            ) {
                // remove unnessesary stub
                break;
            }

            let div = document.createElement("div")
            div.classList.add("appointment");
            div.classList.add("shine");
            let eventPart = new CalendarTableEventPart(div, wholeDay, start, end);

            // content
            if (parent.dayCount < 30) {
                let b = document.createElement("b");
                div.appendChild(b);
                b.innerHTML = appointment.summary;
                let p = document.createElement("p");
                p.innerHTML += "von: " + appointment.dtstart.toLocaleString("de");
                p.innerHTML += "<br>bis: " + appointment.dtend.toLocaleString("de");
                div.appendChild(p);
                if (!wholeDay) {
                    // make appointment style open in case it goes over date line
                    if (!Common.sameDay(appointment.dtstart, current)) {
                        div.classList.add("opentop");
                    }
                    if (!Common.sameDay(appointment.dtend, current)) {
                        div.classList.add("openbottom");
                    }
                    div.style.height = "calc(" + (100 * deltah) + "% +  var(--appointment-radius))";

                    // Overlap handling
                    while(CalendarTableEventPart.overlapCount(eventPart, parent.evtParts) && eventPart.track < CalendarTable.DAV_VIEW_MAX_TRACKS){
                        console.log(appointment.summary + " overlaps");
                        eventPart.setTrack(eventPart.track + 1);
                    }
                    parent.evtParts.push(eventPart);
                }

                let startcell = parent.getCell(start, wholeDay);
                // Get the diff of start and cell in hours
                let deltastart = (start.getTime() - startcell.start.getTime()) / Common.MS_HOUR;
                div.style.top = Math.round(100 * deltastart) + "%";
                startcell.dom.appendChild(div);
            }else{
                // Month View
                if(!wholeDay){
                    let b = document.createElement("b");
                    // Arrows
                    if(firstDay && !lastDay){
                        b.innerHTML += "&#x21A6;";
                    }else if(!firstDay && lastDay){
                        b.innerHTML += "&#x21E5;";
                    }else if(!firstDay && !lastDay){
                        b.innerHTML += "&#x27F7;";
                    }

                    if(firstDay){
                        b.innerHTML += start.toLocaleString("default", {
                            hour: "numeric",
                            minute: "2-digit"
                        });
                    }else if(lastDay){
                        b.innerHTML += appointment.dtend.toLocaleString("default", {
                            hour: "numeric",
                            minute: "2-digit"
                        });
                    }
                    div.appendChild(b);
                }

                div.innerHTML += " " + appointment.summary;

                let cell = parent.getCell(start, wholeDay);
                cell.dom.appendChild(div);
            }

            div.style.backgroundColor = appointment.calendar.color;
            appointment.dom.push(div);
            current = Common.addDays(current, 1);
        }
    }

    static arrangeTracks(parent){
        console.log("A Request has finished");
        parent.counter++;
        if(parent.calendarCount > parent.counter){
            return;
        }

        console.log("Arranging elements...");
        parent.evtParts.forEach(p => {
            let olc = CalendarTableEventPart.overlapCount(p, parent.evtParts, true);
            //console.log(p.dom.innerHTML + " has " + olc);
            p.dom.style.width = "calc((100% - var(--appointment-radius))/" + (olc + 1) + ")";
            p.dom.style.left = "calc(100% * " + (p.track)/(olc + 1) + ")";
        });
    }

    clear() {
        this.thead.innerHTML = "";
        this.tbody.innerHTML = "";
    }

    get dom() {
        return this.table;
    }

    /*
        @brief Helper function to get the first day for a calendar period
        @param [day] Starting day.
        @return in case of 3 days, the first. In case of 7 the first of the week
    */
    getStartDate(date) {
        const MONDAY = 1;
        //console.log(this.dayCount);
        switch (this.dayCount) {
            case 7: {
                let diff = MONDAY - date.getDay();
                // add/substract a day in ms
                return new Date(date.getTime() + Common.MS_DAY * diff);
            } break;
            case 30: {
                // Substract until date is a monday
                let y = date.getFullYear();
                let m = date.getMonth();
                date = new Date(y, m, 1);

                let limit = 16;
                while (date.getDay() != MONDAY && limit--) {
                    date.setTime(date.getTime() - Common.MS_DAY);
                }
            } break;
            default: break;
        }
        date = Common.timeSet0(date);
        return date;
    }

    // returns [startdate, enddate]
    getDateInterval() {
        this.start = Common.timeSet0(this.start);
        let ret = [this.start, new Date(this.start.getTime() + Common.MS_DAY * this.dayCount)];
        // month
        if (this.dayCount == 30) {
            let diff = CalendarTable.WEEK_COUNT_MONTH_VIEW * 7 * Common.MS_DAY;
            ret[1] = new Date(this.start.getTime() + diff);
        }
        return ret;
    }

    monthWidgetShow(month) {
        let h3 = CalendarTable.monthWidget.querySelector("h3") ?? CalendarTable.monthWidget;
        h3.innerHTML = month;
        CalendarTable.monthWidget.style.display = "unset";
    }

    monthWidgetHide() {
        CalendarTable.monthWidget.style.display = "none";
    }
}

class View {
    static PARENT = document.getElementById("calendarspace") ?? document.body;
    static xDown = null;
    static yDown = null;
    static DAYS_DEFAULT = 3;
    constructor(days = View.DAYS_DEFAULT, calendars = []) {
        this.start = new Date();
        this.end = new Date();

        this.dom = document.createElement("div");
        this.setCalendars(calendars);
        View.PARENT.appendChild(this.dom);

        this.table = new CalendarTable();

        this.dom.append(this.table.dom);
        this.setDays(days);

        View.xDown = null;
        View.yDown = null;
    }
    /*
        Set the number of days displayed. e.g 1 day, 3 days or 7 for the week. Start will be picked automatically
    */
    setDays(days, start) {
        if (start) {
            this.start = start;
        }
        this.days = days;
        this.table.calendarCount = this.calendars.length;
        this.table.setDays(this.days, this.start);
        let bounds = this.table.getDateInterval();
        this.calendars.forEach(calendar => {
            calendar.update(bounds, this.table, CalendarTable.addEvent, CalendarTable.arrangeTracks);
        });
    }
    /*
        Set calendars
    */
    setCalendars(calendars) {
        this.calendars = calendars;
    }
    /*
        Use this function to specify the name of the raido inputs, that will be used to set the range
    */
    setRangeRadioName(name) {
        let inps = document.querySelectorAll('input[name="' + name + '"]');
        for (let i = 0; i < inps.length; i++) {
            inps[i].addEventListener("click", (evt) => {
                // on value change, set the day-count
                this.setDays(evt.target.value ?? View.DAYS_DEFAULT);
            });
        }
    }

    addPage(j) {
        //console.log("Adding " + j + " pages");
        if (j < 0) {
            let di = this.table.getDateInterval();
            let diff = di[1].getTime() - di[0].getTime();
            if (this.days < 30) {
                let start = new Date(di[0].getTime() - diff);
                this.setDays(this.days, start);
            } else {
                // Add days to be within the safe rage in month view
                this.setDays(this.days, Common.addDays(di[0], -1));
            }
        } else if (j > 0) {
            let di = this.table.getDateInterval();
            this.setDays(this.days, di[1]);
        }
    }

    prev() {
        this.addPage(-1);
    }

    next() {
        this.addPage(1);
    }

    today() {
        this.setDays(this.days, new Date());
    }

    static getTouches(evt) {
        return evt.touches ||      // browser API
            evt.originalEvent.touches; // jQuery
    }

    static touchStart(evt) {
        const firstTouch = View.getTouches(evt)[0];
        View.xDown = firstTouch.clientX;
        View.yDown = firstTouch.clientY;
        //console.log(View.xDown + " - " + View.yDown);
    }

    static touchMove(evt) {
        if (!View.xDown || !View.yDown) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        var xDiff = View.xDown - xUp;
        var yDiff = View.yDown - yUp;

        /*most significant*/
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                /* right swipe */
                console.log("Swipe Right to Left!");
                View.PARENT.innerHTML += "Swipe Right to Left!<br>";
            } else {
                /* left swipe */
                console.log("Swipe Left!");
                View.PARENT.innerHTML += "Swipe Left to Right!<br>";
            }
        } else {
            if (yDiff > 0) {
                /* down swipe */
                console.log("Swipe Down to Up!");
            } else {
                /* up swipe */
                console.log("Swipe Up to Down!");
            }
        }
        /* reset values */
        View.xDown = null;
        View.yDown = null;
    }
}
document.addEventListener('touchstart', View.touchStart, false);
document.addEventListener('touchmove', View.touchMove, false);