<?php if(!defined('IN_INCLUDE')) die('you cannot load this page directly.');

$site_name = 'Новый';

$menu = [
  '/' => 'Главная',
  'about' => 'О нас',
  'contacts' => 'Контакты'
];

if(!isset($_GET['id'])) $page = 'home';
elseif(file_exists('pages/'.$_GET['id'].'.php')) $page = $_GET['id'];
else $page = '404';

function get_menu() {
  global $menu;

  $item = 'menu__item';
  $current = $item.'--active';

  if(!isset($_GET['id'])) $href = '/';
  else $href = $_GET['id'];

  foreach ($menu as $key => $value) {
    if($key == $href) $class = "$item $current";
    else  $class = $item;
    echo "<a href='$key' class='$class'>$value</a>";
  }
}