<html>
<body>
<?php
$client_id = 'SHUTTERSTOCKCLIENTID'; 
$client_secret = 'SHUTTERSTOCKCLIENTSECRET'; 
// Set redirect uri to the current url
$redirect_uri = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . "{$_SERVER['HTTP_HOST']}" . strtok($_SERVER['REQUEST_URI'], '?');
// Retrieve access token if we have an access code
if(isset($_GET['code'])) {
  $url = 'https://accounts.shutterstock.com/oauth/access_token';
  $params = array(
      code => $_GET['code'],
      client_id => $client_id,
      client_secret => $client_secret,
      redirect_uri => $redirect_uri,
      grant_type => 'authorization_code'
  );
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
  curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  $response = curl_exec($ch);
  curl_close($ch);
  $json = json_decode($response);
  if (json_last_error()) { ?> 
    <script>
    window.opener.oauth2AccessTokenCallback(false, null, "<?php echo(response)?>");
    </script> <?php
  } else { ?> 
    <script>
    window.opener.oauth2AccessTokenCallback(true, "<?php echo($json->access_token)?>");
    </script> <?php
  }
} ?> 
</body>
</html>