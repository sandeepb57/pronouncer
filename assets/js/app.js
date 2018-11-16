/*
 APP Name           : Prononcer
 Created on         : OCT 05, 2018, 10:36:22 PM
 Author             : Sandeep B
 Organisation name  : www.ameripro-solutions.com
 */


var availableWords;
var isRecorded = false;
var audioFiles = [];
var audioIndex = 1;
$(document).ready(function() {

    $('.tooltipped').tooltip({ delay: 50 });

    disableAddWordBtn();

    $("#words").autocomplete({
        source: availableWords
    })

    $(document).on("click", "#addword:not(.hidden)", function() {
        $("#addword").addClass("hidden");
        $("#record").removeClass("hidden");
    });

    $(document).on("click", "#record:not(.hidden)", function() {
        Fr.voice.record(false, function() {
            // console.log("recording......");
            isRecorded = true;
            $("#record").addClass("hidden");
            $("#stoprecord").removeClass("hidden");
        });
    });

    $(document).on("click", "#stoprecord:not(.hidden)", function() {
        $("#stoprecord").addClass("hidden");
        if (isRecorded) {
            Fr.voice.export(loadAudios, "blob");
        } else {
            $.growl.error({ title: "Error", message: 'Error occurred' });
        }
        // Fr.voice.export(function(url) {
        //     $("#audio").attr("src", url);
        //     $("#play,  #desc, #save, #reset,#cancel").removeClass("hidden");
        // }, "URL");
    });

    $(document).on("click", "#play:not(.hidden)", function() {
        $("#audio")[0].play();
        $("#play").addClass("hidden");
        $("#stopplay").removeClass("hidden");
    });

    $(document).on("click", "#stopplay:not(.hidden)", function() {
        $("#audio")[0].pause();
        $("#audio")[0].currentTime = 0;
        $("#stopplay").addClass("hidden");
        $("#play").removeClass("hidden");
    });

    // document.getElementById("audio").onended = function() {
    //     $("#audio")[0].pause();
    //     $("#audio")[0].currentTime = 0;
    //     $("#stopplay").addClass("hidden");
    //     $("#play").removeClass("hidden");
    // };

    $(document).on("click", "#reset:not(.hidden)", function() {
        if (isRecorded) {
            Fr.voice.stop();
            isRecorded = false;
        }
        $("#play, #stopplay").addClass("hidden");
        $("#record").removeClass("hidden");
        $("#desc").val('');
        $("#audio").attr('src', '');
    });

    $(document).on("click", "#cancel:not(.hidden)", function() {
        restore();
    });

    $(document).on("click", "#clear:not(.hidden)", function() {
        restore();
    });

    $(document).on("click", "#save:not(.hidden)", function() {
        $("#save").addClass("hidden");
        $("#save-loader").removeClass("hidden");
        if (isRecorded) {
            Fr.voice.export(upload, "blob");
            Fr.voice.export(testLoadAudios, "blob");
        } else {
            upload('');
        }

        function upload(blob) {
            var formData = new FormData();
            formData.append("type", 'submitWordInfo');
            formData.append("word", $.trim($("#words").val()));
            formData.append("desc", $.trim($("#desc").val()));

            $.each(audioFiles, function(key, files) {
                formData.append("audio" + files.index, files.audioFile);
            });

            $.each(audioFiles, function(key, files) {
                formData.append("priority" + files.index, files.priority);
            });

            $.ajax({
                url: "saveaudiofile.php",
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                success: function(response) {
                    response = $.parseJSON(response);
                    if (response.status == 200) {
                        //alert(response.message);
                        $.growl.notice({ title: "Success", message: response.message });
                        $("#save-loader").addClass("hidden");
                        $("#save").removeClass("hidden");
                        restore();
                    } else {
                        //alert(response.message);
                        $.growl.error({ title: "Error", message: response.message });
                        $("#save-loader").addClass("hidden");
                        $("#save").removeClass("hidden");
                    }
                }
            });
        }
    });

    $(document).on("click", "#removeAudioFile", function() {
        // console.log(23, $(this));
        $(this).closest(".input-group").remove();
    });
});

function disableAddWordBtn() {
    if ($.trim($("#words").val()) == '') {
        $("#addword").addClass("disabled");
    } else {
        $("#addword").removeClass("disabled");
    }
}

function restore() {
    if (isRecorded) {
        Fr.voice.stop();
    }
    isRecorded = false;
    $("#addword").removeClass("hidden");
    $("#play,  #desc, #save, #cancel, #clear, #stopplay, #save-loader, #record, #reset, #desclabel").addClass("hidden");
    $("#words, #desc").val('');
    $("#audio").attr('src', '');
    $("#audio-files").html('');
    audioFiles = [];
    audioIndex = 1;
    disableAddWordBtn()
}

function loadAudios(blob) {
    // console.log(blob, URL.createObjectURL(blob));
    audioFiles.push({ index: audioIndex, audioFile: blob, priority: 0, });
    // console.log(audioFiles);
    $("#audio-files").append(`<div class="input-group mb-2 col-lg-5 offset-lg-3 col-md-6 offset-md-2">
                                <div class="form-group col-md-12">
                                    <label class="col-12" for="desc">Audio file</label>
                                    <div class="row">
                                        <audio class="col-10" controls controlsList="nodownload">
                                            <source src="${URL.createObjectURL(blob)}" type="audio/wav">
                                        </audio>
                                        <input class="form-control audio-order col-2" type="text" name="wordAudiosNum[]" id="wordAudiosNum${audioIndex}" min="1" max="3" value="" oninput="updatePriorityNumber(${audioIndex}, this.value, this)" />
                                        <button class="col-2 form-control icon-cancel hidden" id="removeAudioFile" title="Remove"><i class="icon ion-md-close"></i></button>
                                    </div>
                                </div>
                            </div>`);
    if (isRecorded) {
        Fr.voice.stop();
        isRecorded = false;
        if (audioFiles.length < 3) {
            $("#record, #desc, #save, #reset,#cancel").removeClass("hidden");
        } else {
            $("#desc, #save, #reset,#cancel").removeClass("hidden");
        }
        audioIndex++;
    }
}

function updatePriorityNumber(aIndex, pNum, el) {
    // console.log(aIndex, Number(pNum));
    var checkPriorityNum = audioFiles.find(x => x.priority == pNum);
    var audioFileIndex = audioFiles.findIndex(x => x.index == aIndex);
    if (Number(pNum) > 0) {
        if (checkPriorityNum) {
            $.growl.error({ title: "Error", message: 'You have already assigned ' + pNum + ' as priority number.' });
            $(el).val('');
        } else {
            audioFiles[audioFileIndex].priority = Number(pNum);
        }
    } else {
        audioFiles[audioFileIndex].priority = 0;
    }
}

function searchWords(word) {
    $('#words').autocomplete({
        source: function(request, response) {
            $.post('saveaudiofile.php', { type: 'searchWords', words: word }, function(words) {
                // console.log($.parseJSON(words))
                response($.parseJSON(words))
            });
        },
        select: function(event, ui) {
            // console.log(event, event.currentTarget.innerText);
            setTimeout(() => {
                fetchWordInfo(event.target.value);
            }, 10);
        }
    });
    fetchWordInfo(word);
    disableAddWordBtn();
}

function fetchWordInfo(word) {
    $.post('saveaudiofile.php', { type: 'fetchWordsInfo', words: $.trim(word) }, function(response) {
        // console.log($.parseJSON(response))
        response = $.parseJSON(response);
        if (response.status == 200) {
            $("#addword").addClass("hidden");
            // #record, #save
            $("#desc, #clear, #desclabel").removeClass("hidden");
            $("#audio-files").html('');
            $.each(response.words, function(key, files) {
                $("#audio-files").append(`<div class="input-group mb-2 col-lg-5 offset-lg-3 col-md-6 offset-md-2">
                                            <div class="form-group col-md-12">
                                                <label class="col-12" for="desc">Audio file</label>
                                                <div class="row">
                                                    <audio class="col-10" controls controlsList="nodownload">
                                                        <source src="${files.audioFilePath}" type="audio/wav">
                                                    </audio>
                                                    <input class="form-control audio-order col-2" type="text" name="wordAudiosNum[]" id="wordAudiosNum${files.audioFilePriority}" min="1" max="3" value="${files.audioFilePriority}" />
                                                    <button class="col-2 form-control icon-cancel hidden" id="removeAudioFile" title="Remove"><i class="icon ion-md-close"></i></button>
                                                </div>
                                            </div>
                                        </div>`);
            });
            $("#desc").val(response.words[0].wordDesc);
        } else {
            isRecorded = false;
            $("#addword").removeClass("hidden");
            $("#play, #desc, #save, #cancel, #clear, #stopplay, #save-loader, #record, #desclabel").addClass("hidden");
            $("#desc").val('');
            $("#audio-files").html('');
            disableAddWordBtn()
        }
    });
}