$(function(){
 
    $('#serverless-form').submit(function(e){
        e.preventDefault();
        var formdata = toJSONString(this);
        // Validate form data before sending
        var parsedData;
        try {
            parsedData = JSON.parse(formdata);
            // Basic validation - ensure required fields are present and not empty
            if (!parsedData.name || !parsedData.email || !parsedData.message) {
                $('#status').text('Please fill in all required fields').show();
                return false;
            }
        } catch (e) {
            $('#status').text('Error processing form data').show();
            return false;
        }
        console.log('Sanitized form data:', formdata);
        $.ajax({
            type: "POST",
            crossDomain: "true",
            //url: `https://api.allorigins.win/raw?url=${URL}`,
            //url: `https://cors-anywhere.herokuapp.com/${URL}`,
            //url: `https://tranquil-waters-66085.herokuapp.com/${URL}`,
            url: URL,
            dataType: "json",
            contentType: "application/json",
            data: formdata,
            beforeSend: function(data) {
                $('#submit').attr('disabled', true);
                $('#status').html('<i class="fa fa-refresh fa-spin"></i> Sending Mail...').show();
            },
            success: function(data) {
                console.log(data);
                $('#status').text('Message sent');
//                $('#status').text(data).show();
                $('#submit').removeProp('disabled');
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $('#status').text('Mail sending Failed. Error: ' + jqXHR.status).show();
                $('#submit').removeProp('disabled');
            }
        });
    });

    function toJSONString (form) {
		var obj = {};
		var elements = form.querySelectorAll("input, select, textarea");
		for(var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			var name = element.name;
			var value = element.value;
			if(name) {
				// Basic input sanitization for form data
				var sanitizedValue = value ? value.substring(0, 10000).trim() : '';
				obj[name] = sanitizedValue;
			}
        }
        return JSON.stringify(obj);
    }
});
