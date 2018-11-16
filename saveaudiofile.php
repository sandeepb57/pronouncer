<?php
// echo sizeof($_FILES);
// print_r($_POST);
// print_r($_FILES);exit();
include "config.php";

$type = $_POST['type'];

switch ($type) {
    case 'searchWords':
        searchWords();
        break;
    case 'submitWordInfo':
        submitWordInfo();
        break;
    case 'fetchWordsInfo':
        fetchWordsInfo();
        break;
    default:
        break;
}

function searchWords()
{
    $db = new Db();
    $words = $db->select("select wordName as label, wordName as value from words where wordName Like '%" . $_POST['words'] . "%' order by wordName ASC");
    if (is_array($words) && sizeof($words) > 0) {
        echo json_encode($words);
    } else {
        echo json_encode([]);
    }
}

function fetchWordsInfo()
{
    $db = new Db();
    $words = $db->select("select w.wordId, w.wordName, w.wordDesc, wa.audioFileId, wa.audioFilePath, wa.audioFilePriority from words w LEFT JOIN word_audio_files wa ON wa.wordId = w.wordId where w.wordName ='".$_POST['words']."' ORDER BY wa.audioFilePriority ASC");
    if (is_array($words) && sizeof($words) > 0) {
        echo json_encode(array("status" => 200, "words" => $words));
    } else {
        echo json_encode(array("status" => 204, "words" => []));
    }
}

function submitWordInfo()
{
    $db = new Db();

    $word = $_POST['word'];
    $desc = $_POST['desc'];
    $currDateTime = date("Y-m-d H:i:s");

    $words = $db->select("select wordId, wordName, audioFile from words where wordName ='" . $word . "'");

    if (is_array($words) && sizeof($words) > 0) {
        $wordId = $words[0]['wordId'];
        if ($_FILES['audio']) {
            $audio = audioFileUpload($word);
            if ($audio) {
                if ($words[0]['audioFile'] != '') {
                    unlinkFiles($words[0]['audioFile']);
                }
                $updateWordSql = "UPDATE words SET wordDesc='" . $desc . "', audioFile='" . $audio . "', editedDate= '" . $currDateTime . "' WHERE wordId='" . $wordId . "'";
            } else {
                errorResponseMethod();
                return;
            }
        } else {
            $updateWordSql = "UPDATE words SET wordDesc='" . $desc . "', editedDate= '" . $currDateTime . "' WHERE wordId='" . $wordId . "'";
        }
        $updateWordInfo = $db->query($updateWordSql);
        if ($updateWordInfo) {
            successResponseMethod();
        } else {
            errorResponseMethod();
        }
    } else {
        $insertWordId = $db->insert("INSERT INTO words(wordName, wordDesc, addedDate) VALUES ('" . $word . "','" . $desc . "', '" . $currDateTime . "')");
        if ($insertWordId) {
            for ($i = 1; $i <= sizeof($_FILES); $i++) {
                $audioFilePos = 'audio' . $i;
                $audio = audioFileUpload($word, $audioFilePos, $_POST['priority' . $i]);
                $priorityNumber = $_POST['priority' . $i];
                $insertAudioFile = $db->insert("INSERT INTO word_audio_files(wordId, audioFilePath, audioFilePriority, addedDate) VALUES (" . $insertWordId . ", '" . $audio . "', " . $priorityNumber . ", '" . $currDateTime . "')");
            }
            successResponseMethod();
        } else {
            errorResponseMethod();
            return;
        }
    }
}

function audioFileUpload($word, $audioFilePos, $pNum)
{
    // file to place within the server
    $path = "assets/wordaudios/";

    // list of file extention to be accepted
    $validFileFormats = array("audio/wav", "audio/mp3");

    if (isset($_POST) and $_SERVER['REQUEST_METHOD'] == "POST") {

        $fileName = $_FILES[$audioFilePos]['name'];
        $size = $_FILES[$audioFilePos]['size'];

        if (strlen($fileName)) {
            if (in_array($_FILES[$audioFilePos]['type'], $validFileFormats)) {
                $fileExt = $_FILES[$audioFilePos]['type'] == 'audio/mp3' ? 'mp3' : 'wav';
                $newFilename = $word . '_' . $pNum . '_' . date("YmdHis") . '.' . $fileExt;
                $tmpFileName = $_FILES[$audioFilePos]['tmp_name'];
                if (move_uploaded_file($tmpFileName, $path . $newFilename)) {
                    return $path . $newFilename;
                } else {
                    return false;
                }
            }
        }
    }
}

function unlinkFiles($filePathName)
{
    if (unlink($filePathName)) {
        return true;
    } else {
        return false;
    }
}

function successResponseMethod()
{
    echo json_encode(array("status" => 200, "message" => "Successfully saved."));
}

function errorResponseMethod()
{
    echo json_encode(array("status" => 204, "message" => "Something went wrong, try again later."));
}
