<?php
session_start();
require("config.php");
// https://github.com/wvrzel/simpleCalDAV
require_once("simpleCalDAV/SimpleCalDAVClient.php");

function error_auth_exit($status, $msg_add = ""){
    $msg = "<b>".$status."</b>: ";
    switch ($status){
        case 401: $msg .= "Authentication failed!"; break;
        case 403: $msg .= "Forbidden!"; break;
        case 404: $msg .= "Page <code>".$msg_add."</code> not found!"; break;
        default: $msg .= "Unknown error"; break;
    };

    $_SESSION["errmesg"] = $msg;
    header("Location: ./login.php");
    exit();
}
// Test the server url and see if it returns 401
function handle_auth(){
    return; // for dev

    $url = CONFIG["caldav"];
    $credentials = $_SESSION["user"].":".$_SESSION["passwd"];
    // to header
    $header = array(
        "Authorization: Basic " . base64_encode($credentials)
    );
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    curl_setopt($ch, CURLOPT_SSL_VERIFYSTATUS, CONFIG["validate_cert"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);                            //Prevent echo of output
    curl_exec($ch);
    $info = curl_getinfo($ch);
    $status = $info["http_code"];
    curl_close($ch);

    if($status == 401){
        $_SESSION["errmesg"] = "<b>401</b>: Authentication failed!";
        header("Location: ./login.php");
        exit();
    }
}

function getGroupCalendars($group){
    $retval = [];
    $client = new SimpleCalDAVClient();
    try{
        // Session must be opened with user in URL, otherwise, the first user is selected
        $client->connect(
            CONFIG["caldav"].$group,
            $_SESSION["user"],
            $_SESSION["passwd"]
        );
        $retval = $client->findCalendars();
    }catch (Exception $e) {

    }
    return $retval;
}

function calendarInfo($calendar){
    $name = $calendar->getDisplayName();
    $url = $calendar->getURL();
    $color = $calendar->getRBGcolor();
    $order = $calendar->getOrder();
    echo <<<CAL
        <li>
            <b style="color:$color;">$name</b>
            <ul>
                <li>URL: $url</li>
                <li>Color: $color</li>
                <li>Order: $order</li>
            </ul>
        </li>
    CAL;
}

function eventInfo($evt){
    $etag = $evt->getEtag();
    $href = $evt->getHref();
    $data = nl2br($evt->getData());
    echo <<<EVT
        <li>
            <b>Oida</b>
            <ul>
                <li><b>Etag:</b> $etag</li>
                <li><b>Href:</b> $href</li>
                <li><b>data:</b><br> $data</li>
            </ul>
        </li>
    EVT;
}
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Calendar Client</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" type="text/css" href="styles/common.css">
        <link rel="stylesheet" type="text/css" href="styles/input.css">
        <link rel="stylesheet" type="text/css" href="styles/main.css">
        <link rel="stylesheet" type="text/css" href="styles/calendar.css">
    </head>
    <body>
        <script>
            const CONFIG = JSON.parse('<?php echo json_encode(CONFIG); ?>');
        </script>
        <nav class="top shine">
            <button id="nav-side-toggle" class="mobile-only">&#x2318;</button>
            <h1>Calendar Client</h1>
            <div class="links">
                <p><a href="#"><?php echo($_SESSION["user"]); ?></a></p>
                <p><a href="?logout=1">Log Out</a></p>
            </div>
        </nav>
        <div class="content">
            <nav class="side mobile-hidden">
                <header class="shine d-flex">
                    <h3>View</h3>
                </header>
                <section class="view">
                    <!--<input type="radio" id="view_appointment" name="view" value="appointment" checked>
                    <label for="view_appointment">
                        <img src="https://alpakagott/assets/raspberry.png" alt="rpi">
                        <span>Appointments</span>
                    </label>-->
                    <input type="radio" id="view_1d" name="view" value="1">
                    <label for="view_1d">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>Day</span>
                    </label>
                    <input type="radio" id="view_3d" name="view" value="3" checked>
                    <label for="view_3d">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>3 Days</span>
                    </label>
                    <input type="radio" id="view_week" name="view" value="7">
                    <label for="view_week">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>Week</span>
                    </label>
                    <input type="radio" id="view_month" name="view" value="30">
                    <label for="view_month">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>Month</span>
                    </label>
                </section>
                <header class="shine d-flex">
                    <h3>Clendars</h3>
                    <button>+</button>
                </header>
                <section id="calendarselection">
                </section>
            </nav>
            <article>
                <div class="d-flex justify-content-between">
                    <div class="btn-group" id="navigator">
                        <button type="button" class="btn shine" id="prev">&#x2B05;</button>
                        <button type="button" class="btn shine" id="today">&#x1F4C5; Today</button>
                        <button type="button" class="btn shine" id="next">&#x27A1;</button>
                    </div>
                    <div id="month-widget">
                        <h3></h3>
                    </div>
                </div>
                <div id="calendarspace">
<?php
if(isset($_GET["logout"])){
    if($_GET["logout"] > 0){
        unset($_SESSION["user"]);
        unset($_SESSION["passwd"]);
    }
}

if(!isset($_SESSION["user"]) || !isset($_SESSION["passwd"])){
    header("Location: ./login.php");
    exit();
}

handle_auth();
//$pcal = new Calendar($_SESSION["user"], $_SESSION["passwd"]);

$client = new SimpleCalDAVClient();
try{
    // Session must be opened with user in URL, otherwise, the first user is selected
    $client->connect(
        CONFIG["caldav"].$_SESSION["user"],
        $_SESSION["user"],
        $_SESSION["passwd"]
    );
    // Return object for JS
    $output = [
        "error" => 0,
        "error_message" => "",
        "calendars" => []
    ];
    // Start searching
    $calendars = $client->findCalendars();

    if(isset(CONFIG["group"])){
        $calendars = array_merge($calendars, getGroupCalendars(CONFIG["group"]));
    }

    $testcal = new CalDAVCalendar("/davical/caldav.php/david/schichtplan/", "Test 1");
    $testcal->setRBGcolor("#f5761b");
    array_push($calendars, $testcal);

    foreach ($calendars as $calendar) {
        try{
            //calendarInfo($calendar);
            // Set default color if none is set
            $color = $calendar->getRBGcolor();
            if(strlen($color) < 1){
                $color = CONFIG["color_default"];
            }
            // Build object from calendar data
            array_push($output["calendars"], array(
                "name" => $calendar->getDisplayName(),
                "URL" => $calendar->getURL(),
                "id" => $calendar->getCalendarID(),
                "color" => $color,
                "error" => 0,
                "error_message" => ""
            ));
        }catch(Exception $e){
            //echo $e->__toString();
            // Build error data
            array_push($output["calendars"], array(
                "name" => "",
                "URL" => "",
                "id" => -1,
                "color" => "red",
                "error" => -1,
                "error_message" => $e->getResponseHeader()
            ));
        }
    }
    unset($calendar);
}catch (Exception $e) {
    //echo("<p>".$e->getResponseHeader()."</p>");
    $rhead = $e->getResponseHeader();
    // 401 and Unauthorized
    if(strstr($rhead, "401") && strstr($rhead, "nauth")){
        error_auth_exit(401);
    }
	echo $e->__toString();
    $output["error"] = -1;
    $output["error_message"] = $e->__toString();
}

?>
                </div>
            </article>
        </div>
    </body>
    <script>
        const CALENDARLIST_JSON = '<?php echo json_encode($output); ?>';
        const CALENDARLIST = JSON.parse(CALENDARLIST_JSON);
    </script>
    <script src="scripts/node_modules/ical.js/build/ical.min.js"></script>
    <script src="scripts/calendar.js"></script>
    <script src="scripts/view.js"></script>
    <script src="scripts/main.js"></script>
</html>