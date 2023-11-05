<?php
session_start();
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Anmeldung</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" type="text/css" href="styles/common.css">
        <link rel="stylesheet" type="text/css" href="styles/input.css">
        <link rel="stylesheet" type="text/css" href="styles/login.css">
    </head>
    <body>
        <div class="bg-img"></div>
        <dialog>
            <a href="/" id="back">&larr; Zurück</a>
            <h2>DAViCal Client</h2>
            <?php
                if(isset($_POST["user"]) && isset($_POST["passwd"])){
                    $_SESSION["user"] = $_POST["user"];
                    $_SESSION["passwd"] = $_POST["passwd"];
                    header("Location: ./");
                }

                if(isset($_SESSION["errmesg"])){
                    $msg = $_SESSION["errmesg"];
                    echo <<<ERR
                        <div class="message-box critical">
                            $msg
                        </div>
                    ERR;
                    unset($_SESSION["errmesg"]);
                }
            ?>
            <p>Please log in with calendar credentials</p>
            <form method="POST" action="">
                <label for="user">Username</label>
                <input type="text" name="user" value=""/>
                <label for="passwd">Password</label>
                <div class="input-group">
                    <input type="password" name="passwd" value="" />
                    <button type="button">&#128065;</button>
                </div>
                <input type="submit" name="login" value="Log In" />
            </form>
        </dialog>
        <script>
            let dialog = document.querySelector("dialog");
            if(dialog){
                dialog.showModal();
            }
        </script>
    </body>
</html>
