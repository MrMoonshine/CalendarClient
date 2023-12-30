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
    }
    {
      return 0;
    }
  }
}

class CalendarTable {
  table;
  static DAV_VIEW_MAX_TRACKS = 5;
  static monthWidget = document.getElementById("month-widget");

  constructor(parent, start = null) {
    this.cells = []; // List of table cells
    this.events = []; // List of event-parts

    // Correct start date, in case of week or month view
    this.start = this.getStartDate(start ?? new Date());
    this.table = document.createElement("table");
    this.thead = document.createElement("thead");
    this.tbody = document.createElement("tbody");
    this.table.appendChild(this.thead);
    this.table.appendChild(this.tbody);
    // Hide it
    Common.hide(this.dom);
    parent.appendChild(this.dom);
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
      if (this.dayCount < 30) {
        if (
          // only allow 1h cells if not the whole day is needed
          (ret.start <= date && ret.duration < 24 && !wholeDay) ||
          (ret.start <= date && ret.duration == 24 && wholeDay)
        ) {
          //console.log(ret.start.toLocaleString("de") + " <= " + date.toLocaleString("de"));
          return ret;
        }
      } else {
        if (Common.sameDay(ret.start, date)) {
          return ret;
        }
      }
    }
    return null;
  }

  getActualDayCount() {
    if (this.dayCount < 30) {
      return this.dayCount;
    }

    return 7 * CalendarTable.WEEK_COUNT_MONTH_VIEW;
  }

  arrangingNecessary(element){
    if(element.appointment.wholeDay()){
      return false;
    }
    return true;
  }

  arrangeTracks( ignoreCounter = false) {
    if (!ignoreCounter) {
      console.log("A Request has finished");
      this.counter++;
      if (this.calendarCount > this.counter) {
        return;
      }
    }
    // Reset tracks
    for(let i = 0; i < this.events.length; i++){
      this.events[i].setTrack(0);
    }

    console.log("Arranging elements...");
    for(let i = 0; i < this.events.length; i++){
      if(!this.arrangingNecessary(this.events[i])){
        continue;
      }
      let olc = AppointmentPart.overlapCount(this.events[i], this.events, false);
      let track = 0;
      while(olc > 0 && track < 5){
        this.events[i].setTrack(this.events[i].track + 1);
        track++;
        //console.log("Trying track " + this.events[i].track);
        olc = AppointmentPart.overlapCount(this.events[i], this.events, false);
      }
    };

    for(let i = 0; i < this.events.length; i++){
      if(!this.arrangingNecessary(this.events[i])){
        continue;
      }
      let neighbours = AppointmentPart.getOverlaps(this.events[i], this.events, true);
      let maxtrack = 0;
      //console.log(this.events[i].appointment.summary);
      //console.log(neighbours);

      neighbours.forEach((n) => {
        //console.log("loop" + n.track);
        if(n.track > maxtrack){
          maxtrack = n.track;
        }
      });

      if(this.events[i].track > maxtrack){
        maxtrack = this.events[i].track;
      }

      //let infostr = "<br>track ("+ this.events[i].track +"|"+(maxtrack + 1)+")";
      //this.events[i].dom.innerHTML += infostr;

      neighbours.forEach((n) => {
        n.setCSS(maxtrack);
      });
    }
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
    date = Common.timeSet0(date);
    return date;
  }

  monthWidgetShow(month) {
    let h3 =
      CalendarTable.monthWidget.querySelector("h3") ??
      CalendarTable.monthWidget;
    h3.innerHTML = month;
    CalendarTable.monthWidget.style.display = "unset";
  }

  monthWidgetHide() {
    CalendarTable.monthWidget.style.display = "none";
  }

  update(calendars){
    /*let bounds = this.getDateInterval();
    console.log(bounds);*/
    calendars.forEach((calendar) => {
      /*calendar.update(
        bounds,
        this,
        CalendarTable.addEvent,
        CalendarTable.arrangeTracks
      );*/
      calendar.update(this);
    });
  }

  clear() {
    this.thead.innerHTML = "";
    this.tbody.innerHTML = "";
  }
}

class CalendarTableDays extends CalendarTable {
  constructor(parent, days = 3, start = null) {
    super(parent, start);
    this.dayCount = days;
  }

  setDays(calendars, days, start = null) {
    Common.show(this.dom);
    if (days > 0) {
      this.dayCount = parseInt(days);
    }
    if (start) {
      this.start = start;
    }

    this.cells = [];
    this.events = [];

    this.clear();
    this.monthWidgetHide();

    let trh = document.createElement("tr");
    this.thead.appendChild(trh);
    
    this.start = this.getStartDate(this.start ?? new Date());
    // include an empty one for the clock on the left side
    let thcorner = document.createElement("th");
    thcorner.classList.add("time");
    trh.appendChild(thcorner);
    for (let i = 0; i < this.dayCount; i++) {
      let th = document.createElement("th");
      let date = Common.addDays(this.start, i);
      // mark today
      if(Common.sameDay(date, new Date())){
        th.classList.add("today");
      }
      // format date
      th.innerHTML = date.toLocaleString("default", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      trh.appendChild(th);
    }
    // Get start date
    let date = new Date(this.start);
    date.setMinutes(0);
    date.setHours(0);
    // For whole-day appoinments
    let trwd = document.createElement("tr");
    trwd.classList.add("whole-days");
    let thwdfirst = document.createElement("th");
    thwdfirst.classList.add("time");
    trwd.appendChild(thwdfirst); // Empty element for time col
    for (let i = 0; i < this.dayCount; i++) {
      let cell = new CalendarTableCell(Common.addDays(date, i), 24);
      this.cells.push(cell);
      trwd.appendChild(cell.dom);
    }
    this.tbody.appendChild(trwd);
    // A row for each hour of the day
    for (let i = 0; i < 24; i++) {
      let dateth = document.createElement("th");
      dateth.classList.add("time");
      dateth.innerHTML = date.toLocaleString("default", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      let tr = document.createElement("tr");
      tr.appendChild(dateth);
      for (let i = 0; i < this.dayCount; i++) {
        let cell = new CalendarTableCell(Common.addDays(date, i), 1);
        tr.appendChild(cell.dom);
        this.cells.push(cell);
      }
      this.tbody.appendChild(tr);
      date = new Date(date.getTime() + Common.MS_HOUR);
    }
    // Sort the table
    this.cells.sort(CalendarTableCell.compare);
    /*console.log("Lenght " + this.cells.length);
        this.cells.forEach(elem => {
            console.log(elem.start.toLocaleString("de"));
        });*/
    this.update(calendars);
  }

  getDateInterval() {
    this.start = Common.timeSet0(this.start);
    let ret = [this.start, Common.addDays(this.start, this.dayCount)];
    return ret;
  }

  getStartDate(date) {
    date = Common.timeSet0(date);
    if (this.dayCount == 7) {
      // add/substract a day
      let limit = 7;
      while(date.getDay() != Common.MONDAY && limit--){
        date = Common.addDays(date, -1);
      }
      return date;
    }

    return date;
  }

  addPage(calendars, j) {
    //console.log("Adding " + j + " pages");
    if (j < 0) {
      let di = this.getDateInterval();
      let diff = di[1].getTime() - di[0].getTime();
      let start = new Date(di[0].getTime() - diff);
      this.setDays(calendars, 0, start);
    } else if (j > 0) {
      let di = this.getDateInterval();
      this.setDays(calendars, 0, di[1]);
    }else{

    }
  }
}

class CalendarTableMonth extends CalendarTable {
  static WEEK_COUNT = 6;

  constructor(parent, start = null) {
    super(parent, start);
    this.dom.classList.add("month");
  }

  setMonth(calendars, start = null) {
    Common.show(this.dom);
    this.clear();
    let trh = document.createElement("tr");
    this.thead.appendChild(trh);
    /*
                Month Table
            */
    this.start = start;
    this.start = this.getStartDate(this.start ?? new Date());
    // jump at least a week ahead to be in the current month
    let month_date = Common.addDays(this.start, 7);
    let month = month_date.getMonth();
    //console.log(this.start);
    // Display current month and year
    this.monthWidgetShow(
      month_date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })
    );
    // For each week day
    for (let i = 0; i < 7; i++) {
      let th = document.createElement("th");
      let date = new Date(this.start.getTime() + Common.MS_DAY * i);
      // format date
      th.innerHTML = date.toLocaleString("default", { weekday: "long" });
      trh.appendChild(th);
    }
    /*
                          Days
                      */
    for (let i = 0; i < CalendarTableMonth.WEEK_COUNT; i++) {
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
    this.cells.sort(CalendarTableCell.compare);
    this.update(calendars);
  }

  // returns [startdate, enddate]
  getDateInterval() {
    this.start = Common.timeSet0(this.start);
    let ret = [
      this.start,
      Common.addDays(this.start, this.dayCount),
    ];
    ret[1] = Common.addDays(this.start, CalendarTableMonth.WEEK_COUNT * 7);
    return ret;
  }

  getStartDate(date){
    date = Common.timeSet0(date);
    // Substract until date is a monday
    let y = date.getFullYear();
    let m = date.getMonth();
    date = new Date(y, m, 1);

    let limit = 16;
    while (date.getDay() != Common.MONDAY && limit--) {
      date = Common.addDays(date, -1);
    }
    return date;
  }

  addPage(calendars, j) {
    //console.log("Adding " + j + " pages");
    if (j < 0) {
      let di = this.getDateInterval();
      console.log(di);
      let diff = di[1].getTime() - di[0].getTime();
      // Add days to be within the safe rage in month view
      this.setMonth(calendars, Common.addDays(di[0], -1));
    } else if (j > 0) {
      let di = this.getDateInterval();
      this.setMonth(calendars, di[1]);
    }else{
      this.setMonth(calendars);
    }
  }
}

class View {
  static PARENT = document.getElementById("calendarspace") ?? document.body;
  static xDown = null;
  static yDown = null;
  static DAYS_DEFAULT = 3;
  constructor(calendars, days = View.DAYS_DEFAULT) {
    this.dom = document.createElement("div");
    View.PARENT.appendChild(this.dom);

    this.calendars = calendars;

    this.tableDays = new CalendarTableDays(this.dom);
    this.tableMonth = new CalendarTableMonth(this.dom);
    this.monthview = false;
    Common.show(this.table.dom);
    this.setDays(days);

    View.xDown = null;
    View.yDown = null;
  }

  get table() {
    return this.monthview ? this.tableMonth : this.tableDays;
  }
  /*
        Set the number of days displayed. e.g 1 day, 3 days or 7 for the week. Start will be picked automatically
    */
  setDays(days, start = null) {
    Common.hide(this.tableMonth.dom);
    this.monthview = false;
    this.table.setDays(this.calendars, days, start ?? new Date());
  }

  setMonth(date = null) {
    Common.hide(this.tableDays.dom);
    this.monthview = true;
    this.table.setMonth(this.calendars, date ?? new Date());
  }
  /*
        Use this function to specify the name of the raido inputs, that will be used to set the range
    */
  setRangeRadioName(name) {
    let inps = document.querySelectorAll('input[name="' + name + '"]');
    for (let i = 0; i < inps.length; i++) {
      inps[i].addEventListener("change", (evt) => {
        let dayCount = evt.target.value ?? View.DAYS_DEFAULT;
        // on value change, set the day-count
        if (dayCount < 30) {
          this.setDays(evt.target.value ?? View.DAYS_DEFAULT);
        } else {
          this.setMonth();
        }
      });
    }
  }

  prev() {
    this.table.addPage(this.calendars, -1);
  }

  next() {
    this.table.addPage(this.calendars, 1);
  }

  today() {
    this.table.addPage(this.calendars, 0);
  }

  static getTouches(evt) {
    return (
      evt.touches || // browser API
      evt.originalEvent.touches
    ); // jQuery
  }

  static touchStart(evt) {
    const firstTouch = View.getTouches(evt)[0];
    View.xDown = firstTouch.clientX;
    View.yDown = firstTouch.clientY;
    //console.log(View.xDown + " - " + View.yDown);
  }

  touchMove(evt) {
    if (!View.xDown || !View.yDown) {
      return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = View.xDown - xUp;
    var yDiff = View.yDown - yUp;

    const MIN_DELTA = 8;

    /*most significant*/
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > MIN_DELTA) {
        /* right swipe */
        console.log("Swipe Right to Left! delta = " + xDiff);
        this.next();
        //View.PARENT.innerHTML += "Swipe Right to Left!<br>";
      } else if (xDiff < -MIN_DELTA) {
        /* left swipe */
        console.log("Swipe Left! delta = " + xDiff);
        this.prev();
        //View.PARENT.innerHTML += "Swipe Left to Right!<br>";
      }
    }
    /* reset values */
    View.xDown = null;
    View.yDown = null;
  }
}
