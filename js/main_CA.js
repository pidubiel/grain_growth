var grains = (function () {
    "use strict";

    var canvasCont = document.createElement('div'),
    canvas = document.createElement('canvas'),
    ctx = canvas.getContext("2d"),
    canvas2 = document.createElement('canvas'),
    ctx2 = canvas2.getContext("2d"),
    canvas3 = document.createElement('canvas'),
    ctx3 = canvas3.getContext("2d"),
    grains = {},
    grainIndex = 1,
    inclusions = {},
    inclusionIndex = 1,
    inclusionsCount = 0,
    subCount = 0,
    subAfter = 0,
    energyFlag = [],
    monteTime = 0,
    monteProb = 50,
    matrix = [],
    tmp_matrix = [],
    border = [],
    borderLength = 0,
    _arr = [],
    _length = 0,
    srx = [],
    srxMin = 0,
    srxMax = 0,
    srxRun = false,
    zeroTemp = 0,
    zerosCounts = 0,
    minID = 0,
    finished = false,
    settings = {},
    W = 0,
    H = 0,

    settings = {
        size: 1,
        quantity: 0,
        period: false,
        inclusions: false,
        incOnStart: false,
        incOnEnd: false,
        incShape: "rectangle",
        substructures: false,
        dualphase: false,
        monte: false,
        srx: false,
        srxRandom: false
    };
    var grain = function (_x,_y, srxColor) {
        this.color = (typeof srxColor === 'undefined') ? getRandomColor() : srxColor;

        
        // if(settings.monte) {
        //     this.color = 'red';
        // }
        var x, y;
        if(typeof _x === 'undefined' || typeof _y == 'undefined'){
            do {
                x = Math.floor(Math.random() * W);
                y = Math.floor(Math.random() * H);
                //console.log('matrix:', matrix);
            } while (matrix[x][y] <= minID && matrix[x][y] >= 9999)
        }

        this.x = (typeof _x !== 'undefined') ? _x : x;
        this.y = (typeof _y !== 'undefined') ? _y : y;

        grains[grainIndex] = this;
        grainIndex++;
    }

    var inclusion = function () {
        this.color = "#000";
        var x, y = Math.round((Math.random() * 10) + 5);
        var size = 10;
        if (settings.incOnEnd) {
            do {
                x = Math.round(1 + size / 2 + Math.random() * (W - 2 - size / 2));
                y = Math.round(1 + size / 2 + Math.random() * (H - 2 - size / 2));
            } while (border[x][y] == 0 && matrix[x][y] != 9999)
        } else {
            x = Math.round(1 + size / 2 + Math.random() * (W - 2 - size / 2));
            y = Math.round(1 + size / 2 + Math.random() * (H - 2 - size / 2));
        }

        this.x = x;
        this.y = y;
        this.size = size;

        inclusions[inclusionIndex] = this;
        inclusionIndex++;
    }

    function init() {
        initCanvas();
        initMatrices();
        if (settings.inclusions == true && settings.incOnStart == true) {
            initInclusions();
        }
        if(settings.monte){
            initGrains2();
        } else {
            initGrains();
        }
        loop();    
    }

    function initCanvas() {
        finished = false;
        minID = 0;
        W = canvas.width = canvas2.width = canvas3.width = document.getElementById("in_width").value;
        H = canvas.height = canvas2.height = canvas3.height = document.getElementById("in_height").value;

        settings.quantity = document.getElementById("in_qunatity").value-1;

        (document.getElementById('substructure').checked) ? settings.substructures = true : settings.substructures = false;
        (document.getElementById('dualphase').checked) ? settings.dualphase = true : settings.dualphase = false;
        (document.getElementById('monte').checked) ? settings.monte = true : settings.monte = false;
        (document.getElementById('srx').checked) ? settings.srx = true : settings.srx = false;


        (document.getElementById("period").checked) ? settings.period = true : settings.period = false;

        if (document.getElementById("inclusions").checked) {
            inclusionsCount = document.getElementById("inc_count").value;
            settings.inclusions = true;
            (document.getElementById('inc_start').checked) ? settings.incOnStart = true : settings.incOnStart = false;
            (document.getElementById('inc_end').checked) ? settings.incOnEnd = true : settings.incOnEnd = false;
            (document.getElementById('inc_rect').checked) ? settings.incShape = "Rectangle" : settings.incShape = "Circle";
        } else {
            settings.inclusions = settings.incOnStart = settings.incOnEnd = false;
        }


        subCount = Math.round(1 / 3 * parseInt(settings.quantity));
        subAfter = parseInt(document.getElementById('subCount').value);

        if(settings.monte){
            monteTime = document.getElementById('monteTime').value;
            monteProb = document.getElementById('monteProbability').value;
        }

        if(settings.srx){
            srxMin = document.getElementById('minSrx').value;
            srxMax = document.getElementById('maxSrx').value;
            (document.getElementById('randomSrx').checked) ? settings.srxRandom = true : settings.srxRandom = false;
            srxRun = false;
        }

        canvasCont.className = "canvasCont";
        canvasCont.appendChild(canvas);
        document.body.appendChild(canvasCont);
        ctx3.globalCompositeOperation = ctx2.globalCompositeOperation = ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);
    }

    function initMatrices() {
        for (var i = 0; i < W; i++) {
            matrix[i] = [];
            tmp_matrix[i] = [];
            srx[i] = [];
            energyFlag[i] = [];
            for (var j = 0; j < H; j++) {
                matrix[i][j] = 0;
                tmp_matrix[i][j] = 0;
                srx[i][j] = 0;
                energyFlag[i][j] = 0;
            }
        }
    }

    function initGrains(c, d) {
        c = typeof c !== 'undefined' ? c : 1;
        var leng = typeof d !== 'undefined' ? (c + d) : (c + parseInt(settings.quantity));
        for (c; c <= leng; c++) {
            var z = new grain();
            matrix[z.x][z.y] = c;
            ctx.save();
            ctx.fillStyle = z.color;
            ctx.fillRect(z.x, z.y, settings.size, settings.size);
            ctx.restore();
        }
    }

    function initBorders() {
        ctx.fillStyle = "#000";
        for (var i = 1; i < W - 2; i++) {
            for (var j = 1; j < H - 2; j++) {
                if(matrix[i][j] != 9999){
                    srx[i][j] = srxMin;
                    ctx3.fillStyle = "#fff";
                    ctx3.save();
                    ctx3.fillRect(i, j, 1, 1);
                    ctx3.restore();
                }
                if (matrix[i][j] != 9999 && matrix[i + 1][j] != 9999 && matrix[i][j] != 9999 && matrix[i][j + 1] != 9999) {
                    if (matrix[i][j] != matrix[i][j + 1] || matrix[i][j] != matrix[i + 1][j]) {
                        border[borderLength] = new Array(2);
                        border[borderLength][0] = i;
                        border[borderLength][1] = j;
                        borderLength++;
                        srx[i][j] = srxMax;
                        ctx.save();
                        ctx.fillRect(i, j, 2, 2);
                        ctx.restore();
                        ctx3.fillStyle = "#000";                        
                        if(srxMin==srxMax){
                            ctx3.fillStyle = "#000";
                        }
                        ctx3.save();
                        ctx3.fillRect(i, j, 2, 2);
                        ctx3.restore();
                    }
                }
            }
        }
    }

    function initInclusions() {
        for (var i = 1; i <= inclusionsCount; i++) {
            var z = new inclusion();
            var zxm = Math.round(z.x - z.size / 2), zym = Math.round(z.y - z.size / 2);
            ctx.save();
            ctx.fillStyle = z.color;


            if (settings.incShape.toLowerCase() == "rectangle") {
                ctx.fillRect(zxm, zym, z.size, z.size);
                ctx.restore();
                for (var j = zxm; j < Math.round(zxm + z.size) ; j++) {
                    for (var k = zym; k < Math.round(zym + z.size) ; k++) {
                        if (j > 1 && j < W - 1 && k > 1 && k < H - 1) {
                            matrix[j][k] = 9999;
                            tmp_matrix[j][k] = 9999;
                        }
                    }
                }
            } else {
                ctx.beginPath();
                ctx.arc(z.x, z.y, Math.round(z.size / 2), 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                for (var j = zxm; j < Math.round(zxm + z.size) ; j++) {
                    for (var k = zym; k < Math.round(zym + z.size) ; k++) {
                        var s = Math.round(Math.sqrt((j - z.x) * (j - z.x) + (k - z.y) * (k - z.y)));
                        if (j > 1 && j < W - 1 && k > 1 && k < H - 1 && s < Math.round(z.size / 2)) {
                            matrix[j][k] = 9999;
                            tmp_matrix[j][k] = 9999;
                        }
                    }
                }
            }

            ctx.restore();

        }
    }

    function loop() {
        if (document.getElementById('rules').checked) {
            Rules();
        } else {
            if (document.getElementById('moore').checked) {
                Moore();
            } else if (document.getElementById('vonneuman').checked) {
                vonNeuman();
            } else if (document.getElementById('pentagonal-bottom').checked) {
                Pentagonal();
            } else if (document.getElementById('hexagonal-left').checked) {
                Hexagonal();
            }
        }
        if(!settings.monte){
            UpdateMatrices();
        }

        if (settings.period) {
            function ctxSet(a,b,c,d) {
                matrix[a][b] = matrix[a][c];
                ctx.save();
                ctx.fillStyle = grains[matrix[i][c]].color;
                ctx.fillRect(a, b, settings.size, settings.size);
                ctx.restore();
            }
            for (var i = 1; i < W - 1; i++) {
                if (matrix[i][1] != 0) {
                    ctxSet(i,(H-2), 1);
                    // matrix[i][H - 2] = matrix[i][1];
                    // ctx.save();
                    // ctx.fillStyle = grains[matrix[i][1]].color;
                    // ctx.fillRect(i, H - 2, settings.size, settings.size);
                    // ctx.restore();
                }
                if (matrix[i][H - 2] != 0) {
                    matrix[i][1] = matrix[i][H - 2];
                    ctx.save();
                    ctx.fillStyle = grains[matrix[i][H - 2]].color;
                    ctx.fillRect(i, 1, settings.size, settings.size);
                    ctx.restore();
                }
            }
            for (var j = 1; j < H - 1; j++) {
                if (matrix[1][j] != 0) {
                    matrix[W - 2][j] = matrix[1][j];
                    ctx.save();
                    ctx.fillStyle = grains[matrix[1][j]].color;
                    ctx.fillRect(W - 2, j, settings.size, settings.size);
                    ctx.restore();
                }
                if (matrix[W - 2][j] != 0) {
                    matrix[1][j] = matrix[W - 2][j];
                    ctx.save();
                    ctx.fillStyle = grains[matrix[W - 2][j]].color;
                    ctx.fillRect(1, j, settings.size, settings.size);
                    ctx.restore();
                }
            }
        }

        if (finished == false || (settings.monte && monteTime !=0)) {
            if(monteTime % 100 == 0 && srxRun){
                console.log('asd');
            }
            window.requestAnimationFrame(loop);
            if(--monteTime && settings.monte){
                zerosCounts = monteTime
                //console.log('asdaa');
            } else if(settings.monte) {
                finished = true;
            }
        } else {
            finished = true;
            if (settings.dualphase || settings.substructures) {
                setTimeout(function(){ 
                    SubAndDual();
                    if(document.getElementById('monte').checked){
                        settings.monte = true;
                        monteProb = document.getElementById('monteProbability').value;
                        monteTime = document.getElementById('monteTime').value;
                        initGrains2(minID, subAfter);
                    } else {
                        initGrains(minID, subAfter);
                        zerosCounts = -1;
                        zeroTemp = 0;
                        settings.monte = false;
                    }
                    settings.substructures = false;
                    settings.dualphase = false;
                    finished = false;
                    loop();
                },5000);
            }


            if (settings.inclusions == true && settings.incOnEnd == true) {
                initBorders();
                initInclusions();
            }
            if(!settings.dualphase && !settings.substructures){
                canvasCont.appendChild(canvas2);
                canvasCont.appendChild(canvas3);
                ctx2.drawImage(canvas, 0, 0);
                canvas = canvas2;
                initBorders();
                ctx = ctx2;
            }

            console.log('Finished');
            console.log(grains);
            console.log(inclusions);
        }
    }

    function vonNeuman() {
        if(srxRun){
            var _len = _length, _z, _eNew, _ran, _eOld, _idOld, _idNew, i, j, _H, isrecrystalized, tmpX, tmpY, _temp = new Array(8), _tempi = 0;
            while(_len--){
                _temp = [];
                _tempi = 0;
                isrecrystalized = false;
                _ran = Math.ceil(Math.random()*(_len-1));
                _eNew = 0, _eOld = 0, 

                i = _arr[_ran][0];
                j = _arr[_ran][1];

                _arr.swap(_ran,_len);

                if(matrix[i][j]!=9999){
                    _idOld = tmp_matrix[i][j] = matrix[i][j];

                    for(var ii = -1; ii<2; ii++){
                        for(var jj = -1; jj<2; jj++){
                            if((ii == 0 && jj != 0) || (jj==0 && ii !=0)){
                                (typeof matrix[i+ii][j+jj] !== undefined && matrix[i+ii][j+jj] != _idOld) ? ++_eOld: '';
                                if(srx[i+ii][j+jj] == 0){
                                    isrecrystalized = true;
                                    _temp[_tempi] = new Array(2);
                                    _temp[_tempi][0] = i+ii;
                                    _temp[_tempi][1] = j+jj;
                                    _tempi++;
                                }
                            }
                        }
                    }
                    if(isrecrystalized){
                        var z = Math.floor(Math.random(_tempi));
                        _idNew = tmp_matrix[i][j] = matrix[i][j] = matrix[_temp[z][0]][_temp[z][1]];
                        for(var ii = -1; ii<2; ii++){
                            for(var jj = -1; jj<2; jj++){
                                if((ii == 0 && jj != 0) || (jj==0 && ii !=0)){
                                    (typeof matrix[i+ii][j+jj] !== undefined && matrix[i+ii][j+jj] != _idNew) ? ++_eNew : '';
                                }
                            }
                        }

                        _H = srx[i][j];

                        if(_idNew > minID && _idOld > minID && _idNew < 9999 && _idOld < 9999){
                            if (_eNew - (_eOld + _H) <= 0) {
                                tmp_matrix[i][j] = matrix[i][j] = _idNew;
                                srx[i][j]=0;
                                ctx.save();
                                ctx.fillStyle = grains[_idNew].color;
                                ctx.fillRect(i, j, 1, 1);
                                ctx.restore();
                                ctx3.save();
                                ctx3.fillStyle = "#2626E0";
                                ctx3.fillRect(i, j, 1, 1);
                                ctx3.restore();
                            } else {
                                tmp_matrix[i][j] = matrix[i][j] = _idOld;
                            }
                        }
                    }
                }
            }
        }
        else if(settings.monte){
            var _len = _length, _z, _eNew, _ran, _eOld, _idOld, _idNew, i, j;

            while(_len--){
                _ran = Math.ceil(Math.random()*(_len-1));
                _eNew = 0, _eOld = 0, 

                i = _arr[_ran][0];
                j = _arr[_ran][1];

                _arr.swap(_ran,_len);

                _idOld = tmp_matrix[i][j] = matrix[i][j];

                for(var ii = -1; ii<=1; ii+=2){
                    for(var jj = -1; jj<=1; jj+=2){
                        (typeof matrix[i+ii][j+jj] !== undefined && matrix[i+ii][j+jj] != _idOld) ? ++_eOld: '';
                    }
                }

                _idNew = tmp_matrix[i][j] = matrix[i][j] = matrix[i + Math.round((Math.random() * 2) - 1)][j + Math.round((Math.random() * 2) - 1)];

                for(var ii = -1; ii<=1; ii+=2){
                    for(var jj = -1; jj<=1; jj+=2){
                        (typeof matrix[i+ii][j+jj] !== undefined && matrix[i+ii][j+jj] != _idNew) ? ++_eNew : '';
                    }
                }

                _z = Math.pow(Math.E, (_eNew - _eOld / Math.round((Math.random() * 10)) / 10));

                if(_idNew > minID && _idOld > minID && _idNew < 9999 && _idOld < 9999){
                    if (_eNew - _eOld <= 0 || monteProb <= _z) {
                        tmp_matrix[i][j] = matrix[i][j] = _idNew;
                        ctx.save();
                        ctx.fillStyle = grains[_idNew].color;
                        ctx.fillRect(i, j, 1, 1);
                        ctx.restore();
                    } else {
                        tmp_matrix[i][j] = matrix[i][j] = _idOld;
                    }
                }
            }
        } else {
            var _tmp = [], _counts, _max, _result;
            for (var i = 1; i < W - 1; i++) {
                for (var j = 1; j < H - 1; j++) {
                    if (matrix[i][j] == 0) {
                        _tmp = [0, 0, 0, 0];

                        _tmp[0] = matrix[i - 1][j];
                        _tmp[1] = matrix[i + 1][j];
                        _tmp[2] = matrix[i][j - 1];
                        _tmp[3] = matrix[i][j + 1];

                        _result = _tmp.reduce(function (pv, cv) { return pv + parseInt(cv); }, 0);

                        if (_result > 0) {
                            _max = -1;
                            _counts = [];
                            for (var k = 0; k < 4; k++) {
                                if (_tmp[k] != 0 && _tmp[k] != 9999 && _tmp[k] > minID) {
                                    _counts[_tmp[k]] = (_counts[_tmp[k]] || 0) + 1;
                                    if (_counts[_tmp[k]] > _max) {
                                        _max = _tmp[k];
                                    }
                                }
                            }
                            if (_max > -1 && _max < 9999) {
                                ctx.save();
                                ctx.fillStyle = grains[_max].color;
                                ctx.fillRect(i, j, 1, 1);
                                ctx.restore();
                                tmp_matrix[i][j] = _max;
                            }
                        }
                    }
                }
            }
        }
    }

    function Moore() {
        if (srxRun) {
            var _len = _length, _z, _eNew, _ran, _eOld, _idOld, _idNew, i, j, _H, isrecrystalized, tmpX, tmpY, _temp, _tempi = 0;
            var _counts, _max;
            while(_len--){
                _temp = new Array(8);
                _tempi = 0;
                isrecrystalized = false;
                _ran = Math.ceil(Math.random()*(_len-1));
                _eNew = 0, _eOld = 0, 

                i = _arr[_ran][0];
                j = _arr[_ran][1];

                _arr.swap(_ran, _len);

                if(matrix[i][j] != 9999){
                    _idOld = tmp_matrix[i][j] = matrix[i][j];

                    for (var ii = -1; ii < 2; ii++) {
                        for (var jj = -1; jj < 2; jj++) {
                            if (ii == 0 && jj == 0) {
                                break;    
                            }
                            (typeof matrix[i + ii][j + jj] !== undefined && matrix[i + ii][j + jj] != _idOld) ? ++_eOld : '';
                            if(srx[i+ii][j+jj] == 0){
                                isrecrystalized = true;
                                // _temp[_tempi] = matrix[i+ii][j+jj];
                                _temp[_tempi] = new Array(2);
                                _temp[_tempi][0] = i + ii;
                                _temp[_tempi][1] = j + jj;
                                _tempi++;
                            }
                            // if (srx[i + ii][j + jj] == 0 && isrecrystalized == false) {
                            //     isrecrystalized = true;
                            //     _idNew = tmp_matrix[i][j] = matrix[i][j] = matrix[i+ii][j+jj];
                            //     break;
                            // }
                        }
                        // if(isrecrystalized) { break; }       
                    }


                    if (isrecrystalized) {

                        // _max = -1;
                        // _counts = [];
                        // for (var k = _tempi; k >= 0; k--) {
                        //     if (_temp[k] != 9999 && _temp[k] > minID) {
                        //         _counts[_temp[k]] = (_counts[_temp[k]] || 0) + 1;
                        //         if (_counts[_temp[k]] > _max) {
                        //             _max = _temp[k];
                        //         }
                        //     }
                        // }

                        var z = Math.floor(Math.random(_tempi));
                        // _idNew = tmp_matrix[i][j] = matrix[i][j] = _max;
                        _idNew = tmp_matrix[i][j] = matrix[i][j] = matrix[_temp[z][0]][_temp[z][1]];
                        // _idNew = tmp_matrix[i][j] = matrix[i][j] = matrix[i+ii][j+jj];
                        for (var ii = -1; ii < 2; ii++) {
                            for (var jj = -1; jj < 2; jj++) {
                                if (ii == 0 && jj == 0) {
                                    break;
                                }else {
                                    (typeof matrix[i + ii][j + jj] !== undefined && matrix[i + ii][j + jj] != _idNew) ? ++_eNew : '';
                                }
                            }
                        }

                        _H = srx[i][j];

                        if (_idNew > minID && _idOld > minID && _idNew < 9999 && _idOld < 9999 ) {
                            if (_eNew - (_eOld + _H) <= 0) {
                                tmp_matrix[i][j] = matrix[i][j] = _idNew;
                                srx[i][j] = 0;
                                ctx.save();
                                ctx.fillStyle = grains[_idNew].color;
                                ctx.fillRect(i, j, 1, 1);
                                ctx.restore();
                                ctx3.save();
                                ctx3.fillStyle = "#2626E0";
                                ctx3.fillRect(i, j, 1, 1);
                                ctx3.restore();
                            } else {
                                tmp_matrix[i][j] = matrix[i][j] = _idOld;
                            }
                        }
                    }
                }
            }
        }
        else if (settings.monte) {
            var _len = _length, _z, _eNew, _ran, _eOld, _idOld, _idNew, i, j;
            while (_len--) {
                _ran = Math.ceil(Math.random() * (_len-1));

                _eNew = 0, _eOld = 0;

                i = _arr[_ran][0];
                j = _arr[_ran][1];

                _arr.swap(_ran, _len);

                _idOld = tmp_matrix[i][j] = matrix[i][j];

                for (var ii = -1; ii <= 1; ii++) {
                    for (var jj = -1; jj <= 1; jj++) {
                        if (ii != 0 && jj != 0) {
                            (typeof matrix[i + ii][j + jj] !== undefined && matrix[i + ii][j + jj] != _idOld) ? ++_eOld : '';
                        }
                    }
                }

                _idNew = tmp_matrix[i][j] = matrix[i][j]  = matrix[i + Math.round((Math.random() * 2) - 1)][j + Math.round((Math.random() * 2) - 1)];

                for (var ii = -1; ii <= 1; ii++) {
                    for (var jj = -1; jj <= 1; jj++) {
                        if (ii != 0 && jj != 0) {
                            (typeof matrix[i + ii][j + jj] !== undefined && matrix[i + ii][j + jj] != _idNew) ? ++_eNew : '';
                        }
                    }
                }


                _z = Math.pow(Math.E, (_eNew - _eOld / Math.round((Math.random() * 10)) / 10));

                if(_len == 80000) {
                    console.log(_z);
                }

                if (_idNew > minID && _idOld > minID && _idNew < 9999 && _idOld < 9999) {
                    if (_eNew - _eOld  <= 0 || monteProb <= _z) {
                        tmp_matrix[i][j] = matrix[i][j] = _idNew;
                        ctx.save();
                        ctx.fillStyle = grains[_idNew].color;
                        ctx.fillRect(i, j, 1, 1);
                        ctx.restore();
                    } else {
                        tmp_matrix[i][j] = matrix[i][j] = _idOld;
                    }
                }
            }
        } else {
            var _tmp = [], _counts, _max, _result;
            for (var i = 1; i < W - 1; i++) {
                for (var j = 1; j < H - 1; j++) {
                    if (matrix[i][j] == 0) {
                        _tmp = [0, 0, 0, 0, 0, 0, 0, 0];

                        _tmp[0] = matrix[i - 1][j];
                        _tmp[1] = matrix[i + 1][j];

                        _tmp[2] = matrix[i - 1][j - 1];
                        _tmp[3] = matrix[i + 1][j + 1];

                        _tmp[4] = matrix[i + 1][j - 1];
                        _tmp[5] = matrix[i - 1][j + 1];

                        _tmp[6] = matrix[i][j - 1];
                        _tmp[7] = matrix[i][j + 1];


                        // _result = _tmp.reduce(function (pv, cv) { return pv + parseInt(cv); }, 0);
                        _result = _tmp.reduce((pv, cv) => { return pv + parseInt(cv); }, 0);

                        if (_result > 0 && _result < 9999) {
                            _max = -1;
                            _counts = [];
                            for (var k = 0; k < 8; k++) {
                                if (_tmp[k] != 0 && _tmp[k] != 9999 && _tmp[k] > minID) {
                                    _counts[_tmp[k]] = (_counts[_tmp[k]] || 0) + 1;
                                    if (_counts[_tmp[k]] > _max) {
                                        _max = _tmp[k];
                                    }
                                }
                            }
                            if (_max > -1 && _max < 9999) {
                                ctx.save();
                                ctx.fillStyle = grains[_max].color;
                                ctx.fillRect(i, j, 1, 1);
                                ctx.restore();
                                tmp_matrix[i][j] = _max;
                            }
                        }
                    }
                }
            }
            console.log("Moore");
            console.log(grains);
        }
    }

    function Pentagonal() {
        var _tmp = [], _counts, _max, _result, _dirArr = ["left", "right", "top", "bottom"], _direction = _dirArr[parseInt(Math.random()*4)];
        for (var i = 1; i < W - 1; i++) {
            for (var j = 1; j < H - 1; j++) {
                if (matrix[i][j] == 0) {
                    _tmp = [0, 0, 0, 0, 0, 0, 0, 0];

                    if (_direction != "left") {
                        _tmp[0] = matrix[i - 1][j];
                    }
                    if (_direction != "right") {
                        _tmp[1] = matrix[i + 1][j];
                    }
                    if (_direction != "left" && _direction != "bottom") {
                        _tmp[2] = matrix[i - 1][j - 1];
                    }
                    if (_direction != "right" && _direction != "top") {
                        _tmp[3] = matrix[i + 1][j + 1];
                    }
                    if (_direction != "right" && _direction != "bottom") {
                        _tmp[4] = matrix[i + 1][j - 1];
                    }
                    if (_direction != "left" && _direction != "top") {
                        _tmp[5] = matrix[i - 1][j + 1];
                    }
                    if (_direction != "bottom") {
                        _tmp[6] = matrix[i][j - 1];
                    }
                    if (_direction != "top") {
                        _tmp[7] = matrix[i][j + 1];
                    }


                    _result = _tmp.reduce(function (pv, cv) { return pv + parseInt(cv); }, 0);

                    if (_result > 0 && _result < 9999) {
                        _max = -1;
                        _counts = [];
                        for (var k = 0; k < 8; k++) {
                            if (_tmp[k] != 0 && _tmp[k] != 9999 && _tmp[k] > minID) {
                                _counts[_tmp[k]] = (_counts[_tmp[k]] || 0) + 1;
                                if (_counts[_tmp[k]] > _max) {
                                    _max = _tmp[k];
                                }
                            }
                        }
                        if (_max > -1 && _max < 9999) {
                            ctx.save();
                            ctx.fillStyle = grains[_max].color;
                            ctx.fillRect(i, j, 1, 1);
                            ctx.restore();
                            tmp_matrix[i][j] = _max;
                        }
                    }
                }
            }
        }
    }

    function Hexagonal() {
        var _tmp = [], _counts, _max, _result, _dirArr = ["left", "right"], _direction = _dirArr[parseInt(Math.random()*2)];
        for (var i = 1; i < W - 1; i++) {
            for (var j = 1; j < H - 1; j++) {
                if (matrix[i][j] == 0) {
                    _tmp = [0, 0, 0, 0, 0, 0, 0, 0];

                    _tmp[0] = matrix[i - 1][j];
                    _tmp[1] = matrix[i + 1][j];

                    if (_direction != "right") {
                        _tmp[2] = matrix[i - 1][j - 1];
                        _tmp[3] = matrix[i + 1][j + 1];
                    }
                    if (_direction != "left") {
                        _tmp[4] = matrix[i + 1][j - 1];
                        _tmp[5] = matrix[i - 1][j + 1];
                    }

                    _tmp[6] = matrix[i][j - 1];
                    _tmp[7] = matrix[i][j + 1];


                    _result = _tmp.reduce(function (pv, cv) { return pv + parseInt(cv); }, 0);

                    if (_result > 0 && _result < 9999) {
                        _max = -1;
                        _counts = [];
                        for (var k = 0; k < 8; k++) {
                            if (_tmp[k] != 0 && _tmp[k] != 9999 && _tmp[k] > minID) {
                                _counts[_tmp[k]] = (_counts[_tmp[k]] || 0) + 1;
                                if (_counts[_tmp[k]] > _max) {
                                    _max = _tmp[k];
                                }
                            }
                        }
                        if (_max > -1 && _max < 9999) {
                            ctx.save();
                            ctx.fillStyle = grains[_max].color;
                            ctx.fillRect(i, j, 1, 1);
                            ctx.restore();
                            tmp_matrix[i][j] = _max;
                        }
                    }
                }
            }
        }
    }

    function Rules() {
        var _tmp = [], _tmp2 = [], _tmp3 = [],
        _counts, _max, _max2, _result, _prob = document.getElementById('rule_prob').value,
        _flag = true;

        for (var i = 1; i < W - 1; i++) {
            for (var j = 1; j < H - 1; j++) {
                if (matrix[i][j] == 0) {
                    _flag = true;

                    _tmp = [0, 0, 0, 0, 0, 0, 0];
                    _tmp3 = _tmp2 = [0, 0, 0, 0];

                    _tmp2[0] = _tmp[0] = matrix[i - 1][j];
                    _tmp2[1] = _tmp[1] = matrix[i + 1][j];

                    _tmp2[2] = _tmp[2] = matrix[i][j - 1];
                    _tmp2[3] = _tmp[3] = matrix[i][j + 1];

                    _tmp3[0] = _tmp[4] = matrix[i - 1][j - 1];
                    _tmp3[1] = _tmp[5] = matrix[i + 1][j + 1];

                    _tmp3[2] = _tmp[6] = matrix[i + 1][j - 1];
                    _tmp3[3] = _tmp[7] = matrix[i - 1][j + 1];


                    _result = _tmp.reduce(function (pv, cv) { return pv + parseInt(cv); }, 0);

                    if (_result > 0 && _result < 9999) {
                        _max = -1;
                        _max2 = -1;
                        _counts = [];
                        for (var k = 0; k < 8; k++) {
                            if (_tmp[k] != 0 && _tmp[k] != 9999) {
                                _counts[_tmp[k]] = (_counts[_tmp[k]] || 0) + 1;
                                if (_counts[_tmp[k]] > _max) {
                                    _max = _tmp[k];
                                    _max2 = _tmp[k];
                                }
                            }
                        }

                        if (_counts[_max] < 5 && _counts[_max] > 0) {
                            _max = -1;
                            _counts = [];
                            for (var k = 0; k < 4; k++) {
                                if (_tmp2[k] != 0 && _tmp2[k] != 9999) {
                                    _counts[_tmp2[k]] = (_counts[_tmp2[k]] || 0) + 1;
                                    if (_counts[_tmp2[k]] > _max) {
                                        _max = _tmp2[k];
                                    }
                                }
                            }
                            if (_counts[_max] < 3) {
                                _max = -1;
                                _counts = [];
                                for (var k = 0; k < 4; k++) {
                                    if (_tmp3[k] != 0 && _tmp3[k] != 9999) {
                                        _counts[_tmp3[k]] = (_counts[_tmp3[k]] || 0) + 1;
                                        if (_counts[_tmp3[k]] > _max) {
                                            _max = _tmp3[k];
                                        }
                                    }
                                }
                                if (_counts[_max] < 3) {
                                    var n = Math.random() * 100;
                                    if (n <= _prob) {
                                        _max = _max2;
                                    } else {
                                        _flag = false;
                                    }
                                }
                            }
                        }
                        if (_max > 0 && _flag) {
                            ctx.save();
                            ctx.fillStyle = grains[_max].color;
                            ctx.fillRect(i, j, 1, 1);
                            ctx.restore();
                            tmp_matrix[i][j] = _max;
                        }
                    }
                }
            }
        }
    }

    function SubAndDual() {
        for (var i = 0; i < W; i++) {
            for (var j = 0; j < H; j++) {
                if (matrix[i][j] > subCount && matrix[i][j] < 9999) {
                    tmp_matrix[i][j] = 0;
                    matrix[i][j] = 0;
                    ctx.save();
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(i, j, settings.size, settings.size);
                    ctx.restore();
                } else if (settings.dualphase && matrix[i][j]<9999) {
                    matrix[i][j] = 1;
                    ctx.save();
                    ctx.fillStyle = grains[1].color;
                    ctx.fillRect(i, j, settings.size, settings.size);
                    ctx.restore();
                }
            }
        }
        minID = subCount;
    }

    function UpdateMatrices() {
        zeroTemp = zerosCounts;
        zerosCounts = 0;
        for (var i = 1; i < W - 1; i++) {
            for (var j = 1; j < H - 1; j++) {
                matrix[i][j] = tmp_matrix[i][j];
                if (matrix[i][j] == 0) {
                    zerosCounts++;
                }
            }
        }

        if (zeroTemp == zerosCounts) {
            finished = true;
        }

    }

    function getRandomColor() {
        var r = ((Math.random() * 253) + 1) >> 0,
        g = ((Math.random() * 253) + 1) >> 0,
        b = ((Math.random() * 253) + 1) >> 0;

        return "rgba(" + r + "," + g + "," + b + ", 1)";
    }

    function initGrains2(c, d){
        var _c = typeof c !== 'undefined' ? c : 2;
        var leng = typeof d !== 'undefined' ? (_c + d) : (_c + parseInt(settings.quantity));

        for(_c; _c <= leng; _c++){
            new grain();
        }

        _length = 0;
        _arr = new Array((W-2)*(H-2));
        for(var i = 1; i < W-1; i++){
            for(var j = 1; j < H-1; j++){
                if(matrix[i][j]==0){
                    var e = Math.floor(1 + Math.random() * parseInt(leng - 1));
                    ctx.save();
                    ctx.fillStyle = grains[e].color;
                    ctx.fillRect(i,j,1,1);
                    tmp_matrix[i][j] = matrix[i][j] = e;
                    ctx.restore();
                    _arr[_length] = new Array(2);
                    _arr[_length][0] = i;
                    _arr[_length][1] = j;
                    _length++;
                }
            }
        }
    }

    Array.prototype.swap = function (x,y) {
        var b = this[x];
        this[x] = this[y];
        this[y] = b;
        return this;
    }

    let exportBMP = document.getElementById('exportBMP');
    exportBMP.addEventListener('click', function(ev) {
        console.log(canvas);
        exportBMP.href = canvas.toDataURL();
        exportBMP.download = "grains.png";
      }, false);

    return {
        init: init
    };
})();

(function () {
    document.getElementById('initBtn').addEventListener('click', function () {
        grains.init();
        return false;
    });
})();

$("[type=file]").on("change", function(){
    // Name of file and placeholder
    var file = this.files[0].name;
    var dflt = $(this).attr("placeholder");
    if($(this).val()!=""){
      $(this).next().text(file);
    } else {
      $(this).next().text(dflt);
    }
  });