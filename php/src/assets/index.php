<?php
define("IN_INCLUDE", true);
include 'helpers.php';

include 'includes/header.php';

echo '<main class="content content--'.$page.'">';
include 'pages/'.$page.'.php';
echo '</main>';

include 'includes/footer.php';