$(function() {
  film_roll = new FilmRoll({
    container: '#film_roll',
    no_css: true
  });

  //Enable swiping...
  $("#film_roll").swipe( {
    //Generic swipe handler for all directions
    swipe:function(event, direction, distance, duration, fingerCount) {
      if (direction=="left") { //swipe left
        var i = (film_roll.index+1) % film_roll.children.length;
        film_roll.moveToIndex(i, 'left');
      } else { //swipe right
        var i = (film_roll.index == 0 ? film_roll.children.length : film_roll.index) - 1;
        film_roll.moveToIndex(i, 'right');
      }
    },
    //Default is 75px, set to 0 for demo so any distance triggers swipe
     threshold:0
  });

});
