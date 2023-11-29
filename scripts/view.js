function sameDay(date1, date2){
    return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function timeSet0(date){
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

class CalendarTable{
    table;
    static MS_DAY = 60 * 60 * 24 * 1000;
    static WEEK_COUNT_MONTH_VIEW = 6;

    constructor(days, start = null){
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
                let date = new Date(this.start.getTime() + CalendarTable.MS_DAY * i);
                // format date
                th.innerHTML = date.toLocaleString('default', {weekday: "short", day:"numeric", month: 'short'});
                trh.appendChild(th);
            }
            // A row for each hour of the day
            for(let i = 0; i < 24; i++){
                let date = new Date();
                date.setMinutes(0);
                date.setHours(i);

                let dateth = document.createElement("th");
                dateth.classList.add("time");
                dateth.innerHTML = date.toLocaleString('default', {hour: "2-digit", minute: "2-digit", hour12: false});

                let tr = document.createElement("tr");
                tr.appendChild(dateth);
                for(let i = 0; i < this.dayCount; i++){
                    tr.appendChild(document.createElement("td"));
                }            
                this.tbody.appendChild(tr);
            }
        }else{
            /*
                Month Table
            */
            this.start = this.getStartDate(this.start ?? new Date());
            this.table.classList.add("month");
            // jump at least a week ahead to be in the current month
            let month_date = new Date(this.start.getTime() + CalendarTable.MS_DAY * 7);
            let month = month_date.getMonth();
            console.log(this.start);
            // For each week day
            for(let i = 0; i < 7; i++){
                let th = document.createElement("th");
                let date = new Date(this.start.getTime() + CalendarTable.MS_DAY * i);
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
                    let td = document.createElement("td");
                    let number = document.createElement("number");
                    let day = new Date(this.start.getTime() + CalendarTable.MS_DAY * (i*7 + d));
                    number.innerHTML = day.getDate();
                    // if the day is not in the shown month
                    if(day.getMonth() != month){
                        td.classList.add("shade");
                    }
                    td.appendChild(number);
                    tr.appendChild(td);
                }
            }
        }
    }

    addEvent(calendar, appointment){
        //console.table(calendar);
        console.log(appointment.data);
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
                return new Date(date.getTime() + CalendarTable.MS_DAY * diff);
            } break;
            case 30: {
                // Substract until date is a monday
                let y = date.getFullYear();
                let m = date.getMonth();
                date = new Date(y, m, 1);

                let limit = 16;
                while(date.getDay() != MONDAY && limit--){
                    date.setTime(date.getTime() - CalendarTable.MS_DAY);
                }
            }break;
            default: break;
        }
        date = timeSet0(date);
        return date;
    }

    // returns [startdate, enddate]
    getDateInterval(){
        this.start = timeSet0(this.start);
        let ret = [this.start, new Date(this.start.getTime() + CalendarTable.MS_DAY * this.dayCount)];
        // month
        if(this.dayCount == 30){
            let diff = CalendarTable.WEEK_COUNT_MONTH_VIEW * 7 * CalendarTable.MS_DAY;
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
            calendar.update(bounds, this.table.addEvent);
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