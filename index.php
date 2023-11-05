<?php
session_start();
require("config.php");
require("calendar.php");

function error_auth_exit($msg){
    $_SESSION["errmesg"] = $msg;
    header("Location: ./login.php");
    exit();
}
?>
<!DOCTYPE html>
<html>
<body>
    <p>
        <a href="?logout=1">Log Out</a>
    </p>
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
// Echo session variables that were set on previous page
echo "User is " . $_SESSION["user"] . ".<br>";
echo "Passwd is " . $_SESSION["passwd"] . ".<br>";

/*// basic auth
$credentials = $_SESSION["user"].":".$_SESSION["passwd"];
// to header
$header = array(
    "Authorization: Basic " . base64_encode($credentials)
);
// curl
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://alpaka3d/davical/caldav.php/".$_SESSION["user"]."/calendar");
curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
curl_setopt($ch, CURLOPT_SSL_VERIFYSTATUS, CONFIG["validate_cert"]);
$output = curl_exec($ch);
echo "<p>".nl2br($output)."</p>";
var_dump(curl_getinfo($ch));
curl_close($ch);  */

$pcal = new Calendar($_SESSION["user"], $_SESSION["passwd"]);

echo("<p>All done!</p>");
?>

</body>
</html>