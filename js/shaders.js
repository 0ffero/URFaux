vars.shaders = {
    available: [],

    waterShader: `
    precision mediump float;//Define the precision

    //We pass in a time variable
    uniform float     time;
    //The image we passed in
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1; //The mask
    uniform vec2      resolution; //This is set with phaser's setResolution function

    float waveSize = 5.0;
    float amplitude = 0.02;
    
    void main( void ) {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        uv.y = 1.0-uv.y;//Flip image vertically

        vec4 maskColor = texture2D(iChannel1, uv);
        float waterPower = 1.0 - (maskColor.r * maskColor.g * maskColor.b);

        float X = uv.x * waveSize+time;
        float Y = uv.y * waveSize+time;
        
        float Xoffset = cos(X-Y)*amplitude*cos(Y);
        float Yoffset = sin(X+Y)*amplitude*sin(Y);

        uv.x += Xoffset * waterPower;
        uv.y += Yoffset * waterPower;
        gl_FragColor =  texture2D(iChannel0, uv);
        gl_FragColor.b *= (waterPower +1.0);
    }`
}

uniforms = {
    time: {type:'1f',value:0},
    iChannel0 :{type:'sampler2D',value:gameImage.texture},
    iChannel1 :{type:'sampler2D',value:maskImage.texture}
  }
  
filter = new Phaser.Filter(game, uniforms, shaderCode);//Create phaser filter
var width = window.innerHeight * (gameImage.width/gameImage.height)
filter.setResolution(window.innerWidth,window.innerHeight)
//Apply filter to our object
gameImage.filters = [ filter ];


function GameLoop(){
  uniforms.time.value +=0.02;
}