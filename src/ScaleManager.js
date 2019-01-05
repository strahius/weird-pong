class ScaleManager {
    constructor(width, height) {
        window.addEventListener('resize', () => this.resize(width, height))
        this.resize(width, height);
    }

    resize(config_width, config_height) {
        // Width-height-ratio of game resolution
        let game_ratio = config_width / config_height;

        // Make div full height of browser and keep the ratio of game resolution
        let div = document.getElementById('content');
        div.style.width = (window.innerHeight * game_ratio) + 'px';
        div.style.height = window.innerHeight + 'px';

        // Check if device DPI messes up the width-height-ratio
        let canvas  = document.getElementsByTagName('canvas')[0];

        let dpi_w = parseInt(div.style.width) / canvas.width;
        let dpi_h = parseInt(div.style.height) / canvas.height;

        let height  = window.innerHeight * (dpi_w / dpi_h);
        let width = height * game_ratio;

        // Scale canvas
        canvas.style.width  = width + 'px';
        canvas.style.height = height + 'px';
    }
}

export default ScaleManager;
