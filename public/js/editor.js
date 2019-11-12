$(document).ready(function () {
  var editor = ace.edit('json');
  editor.setTheme('ace/theme/github');
  editor.session.setMode('ace/mode/json');
  editor.setFontSize(14);
  editor.getSession().setUseWorker(false);
  editor.$blockScrolling = Infinity;

  $(document).on('click', '#submit_json', function () {
    try {
      // convert BSON string to EJSON
      var ejson = toEJSON.serializeString(editor.getValue());
      let parsed;
      let url = `/api/v1${$('#app_context').val()}/document/${$('#db_name').val()}/${$('#coll_name').val()}`;

      try {
        parsed = JSON.parse(ejson);
      } catch(e) {
        show_notification(e.message, 'danger');
        return;
      }

      const request = {
        url,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 'objectData': ejson }),
      };

      switch( $('#edit_request_type').val() ) {
        case 'edit_doc': {
          if(parsed && parsed._id) {
            url += `/${parsed._id}`;
          }

          request.url = url;
        }
        break;
        case 'insert_doc':
        default:
        break;
      }

      $.ajax(request)
        .done(function (data) {
          show_notification(data.msg, 'success');
          if (data.doc_id) {
            return setTimeout(function () {
              // remove "new" and replace with "edit" and redirect to edit the doc
              window.location = window.location.href.substring(0, window.location.href.length - 3) + 'edit/' + data.doc_id;
            }, 2500);
          }
        })
        .fail(function (data) {
          show_notification(data.responseJSON.msg, 'danger');
        });
    } catch (err) {
      show_notification(err, 'danger');
    }
  });
});
