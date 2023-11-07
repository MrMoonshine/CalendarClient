<?php
session_start();
require("config.php");
require("calendar.php");

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
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Anmeldung</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" type="text/css" href="styles/common.css">
        <link rel="stylesheet" type="text/css" href="styles/input.css">
        <link rel="stylesheet" type="text/css" href="styles/main.css">
    </head>
    <body>
        <script>
            const CONFIG = JSON.parse('<?php echo json_encode(CONFIG); ?>');
        </script>
        <nav class="top shine">
            <h1>Calendar Client</h1>
            <div class="links">
                <p><a href="#"><?php echo($_SESSION["user"]); ?></a></p>
                <p><a href="?logout=1">Log Out</a></p>
            </div>
        </nav>
        <div class="content">
            <nav class="side">
                <header class="shine">
                    <h3>View</h3>
                </header>
                <section class="view">
                    <input type="radio" id="view_appointment" name="view" value="appointment" checked>
                    <label for="view_appointment">
                        <img src="https://alpakagott/assets/raspberry.png" alt="rpi">
                        <span>Appointments</span>
                    </label>
                    <input type="radio" id="view_1d" name="view" value="1d">
                    <label for="view_1d">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>Day</span>
                    </label>
                    <input type="radio" id="view_3d" name="view" value="3d">
                    <label for="view_3d">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>3 Days</span>
                    </label>
                    <input type="radio" id="view_week" name="view" value="week">
                    <label for="view_week">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>Week</span>
                    </label>
                    <input type="radio" id="view_month" name="view" value="month">
                    <label for="view_month">
                        <img src="https://alpakagott/assets/konqi.png" alt="rpi">
                        <span>Month</span>
                    </label>
                </section>
                <header class="shine">
                    <h3>Clendars</h3>
                </header>
                <section>
                    Calendars
                </section>
                <ul>
                    <li>oida</li>
                    <li>oida</li>
                </ul>
            </nav>
            <article>
                oida
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
echo("<p>All done!</p>");
?>
            </article>
        </div>
    </body>
    <script src="scripts/calendar.js"></script>
</html>