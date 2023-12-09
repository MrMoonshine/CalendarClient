class CalendarTableCell{
    td;
    // start date & duration in h
    constructor(start, duration){
        this.td = document.createElement("td");
        this.start = structuredClone(start);
        this.duration = duration;
    }

    get dom(){
        return this.td;
    }

    static compare(a, b){
        if(a.start < b.start){
            return -1;
        }else if(a.start > b.start){
            return 1;
        }{
            return 0;
        }
    }
}

class CalendarTable{
    table;
    static WEEK_COUNT_MONTH_VIEW = 6;

    constructor(days, start = null){
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
    }

    setDays(days){
        this.cells = [];
        this.dayCount = parseInt(days);
        this.clear();
        let trh = document.createElement("tr");
        this.thead.appendChild(trh);

        this.table.classList.remove("month");
        
        // Check if there should be a month table made
        if(this.dayCount < 30){
            // include an empty one for the clock on the left side
            trh.appendChild(document.createElement("th"));
            for(let i = 0; i < this.dayCount; i++){
                let th = document.createElement("th");
                let date = new Date(this.start.getTime() + Common.MS_DAY * i);
                // format date
                th.innerHTML = date.toLocaleString('default', {weekday: "short", day:"numeric", month: 'short'});
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
            for(let i = 0; i < this.dayCount; i++){
                let cell = new CalendarTableCell(
                    Common.addDays(date, i),
                    24
                );
                this.cells.push(cell);
                trwd.appendChild(cell.dom);
            }
            this.tbody.appendChild(trwd);
            // A row for each hour of the day
            for(let i = 0; i < 24; i++){
                let dateth = document.createElement("th");
                dateth.classList.add("time");
                dateth.innerHTML = date.toLocaleString('default', {hour: "2-digit", minute: "2-digit", hour12: false});

                let tr = document.createElement("tr");
                tr.appendChild(dateth);
                for(let i = 0; i < this.dayCount; i++){
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
        }else{
            /*
                Month Table
            */
            this.start = this.getStartDate(this.start ?? new Date());
            this.table.classList.add("month");
            // jump at least a week ahead to be in the current month
            let month_date = new Date(this.start.getTime() + Common.MS_DAY * 7);
            let month = month_date.getMonth();
            console.log(this.start);
            // For each week day
            for(let i = 0; i < 7; i++){
                let th = document.createElement("th");
                let date = new Date(this.start.getTime() + Common.MS_DAY * i);
                // format date
                th.innerHTML = date.toLocaleString('default', {weekday: "long"});
                trh.appendChild(th);
            }
            /*
                Days
            */
            for(let i = 0; i < CalendarTable.WEEK_COUNT_MONTH_VIEW; i++){
                let tr = document.createElement("tr");
                this.tbody.appendChild(tr);
                // for each day of the week
                for(let d = 0; d < 7; d++){
                    let number = document.createElement("number");
                    let day = new Date(this.start.getTime() + Common.MS_DAY * (i*7 + d));
                    let cell = new CalendarTableCell(day, 24);
                    this.cells.push(cell);

                    number.innerHTML = day.getDate();
                    // if the day is not in the shown month
                    if(day.getMonth() != month){
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
    getCell(date, wholeDay = false){
        const start = this.cells.length - 1;
        let ret = this.cells[start];
        for(let i = start; i >= 0; i--){
            let ret = this.cells[i];
            if(
                // only allow 1h cells if not the whole day is needed
                ret.start <= date && ret.duration < 24 && !wholeDay ||
                ret.start <= date && ret.duration == 24 && wholeDay
            ){
                if(wholeDay){
                    console.log(ret.start.toLocaleString("de") + " < " + date.toLocaleString("de"));
                }
                
                return ret;
            }
        }
        return ret;
    }

    static addEvent(parent, appointment){
        //console.table(calendar);
        //console.log(appointment.data);
        // Week or 3 day view
        if(parent.dayCount < 30){
/*          +--------------------------------------+
            |                                      |
            |    Creating DIVs for Appointments    |
            |            in x-Day view             |
            |                                      |
            +--------------------------------------+    */
            let cell = parent.getCell(appointment.dtstart);

            let current = structuredClone(appointment.dtstart);
            current = Common.timeSet0(current);
            let wholeDay = appointment.wholeDay();
            //console.log(appointment.summary + ": " + (Common.timeSet0(current) <= Common.timeSet0(appointment.dtend)));

            // Step forward a day each time, until the end day is reached.
            while(Common.timeSet0(current) <= Common.timeSet0(appointment.dtend)){
                let start = Common.sameDay(appointment.dtstart, current) ? appointment.dtstart : Common.timeSet0(current);
                let end = appointment.dtend;
                if(!Common.sameDay(current, end)){
                    end = structuredClone(current);
                    end.setHours(23,59,59);
                }
                
                let deltah = (end.getTime() - start.getTime())/Common.MS_HOUR;
                deltah = Common.round(deltah, 2);
                //console.log(appointment.summary + " part has " + deltah + " hours");
                if(deltah <= 0){
                    // remove unnessesary stub
                    break;
                }

                let div = document.createElement("div")
                div.classList.add("appointment");
                div.classList.add("shine");
                // content
                let b = document.createElement("b");
                b.innerHTML = appointment.summary;
                div.appendChild(b);

                let p = document.createElement("p");
                p.innerHTML += "von: " + appointment.dtstart.toLocaleString("de");
                p.innerHTML += "<br>bis: " + appointment.dtend.toLocaleString("de");
                div.appendChild(p);
                if(!wholeDay){
                    // make appointment style open in case it goes over date line
                    if(!Common.sameDay(appointment.dtstart, current)){
                        div.classList.add("opentop");
                    }
                    if(!Common.sameDay(appointment.dtend, current)){
                        div.classList.add("openbottom");
                    }
                    div.style.height = "calc(" + (100*deltah) + "% - 2*var(--appointment-radius))";
                }

                div.style.backgroundColor = appointment.calendar.color;
                appointment.dom.push(div);

                let startcell = parent.getCell(start, wholeDay);
                // Get the diff of start and cell in hours
                let deltastart = (start.getTime() - startcell.start.getTime())/Common.MS_HOUR;
                div.style.top = Math.round(100 * deltastart) + "%";
 
                startcell.dom.appendChild(div);

                current = Common.addDays(current, 1);
            }
        }
    }

    clear(){
        this.thead.innerHTML = "";
        this.tbody.innerHTML = "";
    }

    get dom(){
        return this.table;
    }

    /*
        @brief Helper function to get the first day for a calendar period
        @param [day] Starting day.
        @return in case of 3 days, the first. In case of 7 the first of the week
    */
    getStartDate(date){
        const MONDAY = 1;
        //console.log(this.dayCount);
        switch(this.dayCount){
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
                while(date.getDay() != MONDAY && limit--){
                    date.setTime(date.getTime() - Common.MS_DAY);
                }
            }break;
            default: break;
        }
        date = Common.timeSet0(date);
        return date;
    }

    // returns [startdate, enddate]
    getDateInterval(){
        this.start = Common.timeSet0(this.start);
        let ret = [this.start, new Date(this.start.getTime() + Common.MS_DAY * this.dayCount)];
        // month
        if(this.dayCount == 30){
            let diff = CalendarTable.WEEK_COUNT_MONTH_VIEW * 7 * Common.MS_DAY;
            ret[1] = new Date(this.start.getTime() + diff);
        }
        return ret;
    }
}

class View{
    static PARENT = document.getElementById("calendarspace") ?? document.body;
    static xDown = null;
    static yDown = null;
    static DAYS_DEFAULT = 3;
    constructor(days = View.DAYS_DEFAULT, calendars = []){
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
    setDays(days){
        this.days = days;
        this.table.setDays(this.days);
        let bounds = this.table.getDateInterval();
        this.calendars.forEach(calendar => {
            calendar.update(bounds, this.table, CalendarTable.addEvent);
        });
    }
    /*
        Set calendars
    */
    setCalendars(calendars){
        this.calendars = calendars;
    }
    /*
        Use this function to specify the name of the raido inputs, that will be used to set the range
    */
    setRangeRadioName(name){
        let inps = document.querySelectorAll('input[name="' + name + '"]');
        for(let i = 0; i < inps.length; i++){
            inps[i].addEventListener("click", (evt) => {
                // on value change, set the day-count
                this.setDays(evt.target.value ?? View.DAYS_DEFAULT);
            });
        }
    }

    static getTouches(evt) {
        return evt.touches ||      // browser API
        evt.originalEvent.touches; // jQuery
    }   

    static touchStart(evt){
        const firstTouch = View.getTouches(evt)[0];                                      
        View.xDown = firstTouch.clientX;                                      
        View.yDown = firstTouch.clientY;
        //console.log(View.xDown + " - " + View.yDown);
    }

    static touchMove(evt){
        if ( ! View.xDown || ! View.yDown ) {
            return;
        }
    
        var xUp = evt.touches[0].clientX;                                    
        var yUp = evt.touches[0].clientY;
    
        var xDiff = View.xDown - xUp;
        var yDiff = View.yDown - yUp;
                                                      
        /*most significant*/
        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
            if ( xDiff > 0 ) {
                /* right swipe */
                console.log("Swipe Right to Left!");
                View.PARENT.innerHTML += "Swipe Right to Left!<br>";
            } else {
                /* left swipe */
                console.log("Swipe Left!");
                View.PARENT.innerHTML += "Swipe Left to Right!<br>";
            }                       
        } else {
            if ( yDiff > 0 ) {
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