$(document).ready(function() {
    //toggle `popup` / `inline` mode
    $.fn.editable.defaults.mode = 'inline';
    $('.account-information .editable').editable({
        type: 'select'
        ,ajaxOptions: {
          type: 'put',
          dataType: 'json'
        }
        ,pk: 1
        ,url: '/post'
    });
});
