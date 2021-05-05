<?php
function dirToArray($dir) {
    global $files, $totalSize;
    $result = array();
    $cdir = scandir($dir);
    foreach ($cdir as $key => $value) {
        if (substr_count($value,'__orig')===0) {
            if (!in_array($value,array(".",".."))) {
                if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
                    $result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value);
                } else {
                    if ((substr_count($value, '.png')>0 && substr_count($value, '.fw.')===0) || substr_count($value,'.jpg')>0 || substr_count($value,'.ogg')>0 || (substr_count($value,'.json')>0 && substr_count($value,'fileList.json')===0)) {
                        if (substr_count($value, 'favicon')===0) {
                            $result[] = $value; 
                            $fSize = filesize($dir . DIRECTORY_SEPARATOR . $value);
                            $files['files'][$value] = $fSize;
                            $totalSize+=$fSize;
                        }
                    }
                }
            }
        }
    }
    return $result;
}


$files['files'] = [];
$dir = './';
$totalSize=0;
dirToArray($dir);

$files['details']['totalSize'] = $totalSize;
file_put_contents('./fileList.json', json_encode($files));
echo json_encode($files);
?>