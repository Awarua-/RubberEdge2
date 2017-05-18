var svg = d3.select('body').append('svg').attr({
  width: 300,
  height: 300,
  border: '1px solid #ccc'
});

svg.append('svg:image')
.attr({
  'xlink:href': 'http://www.iconpng.com/png/beautiful_flat_color/computer.png',  // can also add svg file here
  x: 0,
  y: 0,
  width: 128,
  height: 128
});
