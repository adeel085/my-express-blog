console.log("App started");

$(document).ready(function() {
    $(".tab-nav").click(function() {

        $(".tab-nav").removeClass("selected");
        $(this).addClass("selected");

        $(".tab-content").removeClass("selected");
        let tabId = $(this).attr("data-target");
        $(`#${tabId}`).addClass("selected");
    });

    $(".post.clickable").click(function(e) {
        let postId = $(this).attr("data-id");
        
        $(".post-editor").css("display", "none");
        $(".post-editor[data-id='" + postId + "']").css("display", "block");
    });

    $(".delete-post-btn").click(function(e) {
        let postId = $(this).attr("data-id");
        $.ajax({
            url: "/dashboard/blogpost/" + postId,
            method: "delete",
            success: (res) => {
                if (res == "1") {
                    window.location.href = window.location.href;
                }
            },
            error: (err) => {
                console.log(err);
            }
        });
    });
});