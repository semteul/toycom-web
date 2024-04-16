

const wordSize = 8;
const memorySize = 256;
const regs = 8;

var memory = [];
for (var i = 0; i < memorySize; i++) {
    memory.push(0);
}

var registers = [];
for (var i=0; i<regs; i++){
    registers.push(0);
}

var pc = 0x7f; // 처음 시작 위치
var ir = 0;
var sp = 0xff; // 처음 위치
var sr = 0;
var mbr = 0;
var mar = 0;

// 연산회로...
// TODO : SR set 필요
var adder = function (a, b) {
    return (a + b)%(2**wordSize);
}

var subber = function (a, b) {
    b = twosComplement(b);
    return adder(a, b);
}

var twosComplement = function (a) {
    return ~a & (2**wordSize - 1); // ~a & 0xFF
}

var and = function (a, b) {
    return a & b & (2**wordSize - 1);
}

var or = function (a, b) {
    return (a | b) & (2**wordSize - 1);
}

var load = function (address) {
    mbr = memory[address];
}


var memoryTable = document.getElementById("memory");
var rows = memoryTable.getElementsByTagName("tr");
var memoryTableArray = [];
for (var i = 1; i < rows.length; i++) {
    var cells = rows[i].getElementsByTagName("td");
    var rowArray = [];
    for (var j = 0; j < cells.length; j++) {
        rowArray.push(cells[j]);
    }
    memoryTableArray.push(rowArray);
}

const pageSize = memoryTableArray.length;
const pages = memorySize/pageSize;

function toTwoDigitHex(num) {
    let hex = num.toString(16).toUpperCase();
    return "0x" + (hex.length === 1 ? "0" + hex : hex);
}

var page = 0;
var loadPage = function() {
    for (var i=0; i<pageSize; i++) {
        memoryTableArray[i][0].innerText = toTwoDigitHex(pageSize*page + i);
        memoryTableArray[i][1].innerText = toTwoDigitHex(memory[pageSize*page + i]);
    }
}

document.getElementById("next_memory").addEventListener('click', function() {
    if (page < pageSize - 1) {
        page++;
        loadPage();
    }
});

document.getElementById("prev_memory").addEventListener('click', function() {
    if (page > 0) {
        page--;
        loadPage();
    }
});






var assembler = function(program) {
    var instructions = program.split('\n');
    var object = [];
    // TODO : symbol table
    for(i=0;i<instructions.length; i++) {
        object.append(instructionDecoder(instructions[i]));
    }
    return object;
}
var instructionDecoder = function(instruction) {
    if(instruction == ".org"){
        return ".org";
    }
}


var pc = 0;
var ir = 0;

var setPC = function(value) {
    if(typeof value === 'number'){
        pc = value;
        return;
    }
    pc = value;
    console.error('PC must be a number');
}

var loader = function(program_code) {
    // 초기화
    clearMemory();
    clearRegisters();

    pc = 0x7f;
    var lines = program_code.split('\n');
    for(i=0;i<lines.length; i++){
        var line = lines[i];
        if(/^\.org/.test(line)){
            address = parseInt(line.split(' ')[1],16);
            setPC(address);
            continue;
        }

        // hex 저장
        if(/^0x/.test(line)){
            memory[pc++] = parseInt(line, 16);
            continue;
        }

        // Load 처리
        if(/^load/.test(line)) {
            var opcode = 0b0010;
            var tmp = line.split(' ')[1];
            var operand1 = parseInt(tmp.split(',')[0][1]); // r0, r1, r2
            var operand2 = parseInt(tmp.split(',')[1],16);

            var l = (opcode << 4) + (operand1);
            var h = operand2;

            memory[pc++] = h; // little endian
            memory[pc++] = l;

            continue;
        }
        // store 처리
        if(/^store/.test(line)) {
            var opcode = 0b0011;
            var tmp = line.split(' ')[1];
            var operand1 = parseInt(tmp.split(',')[0][1]); // r0, r1, r2
            var operand2 = parseInt(tmp.split(',')[1],16);

            var l = (opcode << 4) + (operand1);
            var h = operand2;

            memory[pc++] = h; // little endian
            memory[pc++] = l;
            continue;
        }
        // add 처리
        if(/^add/.test(line)) {
            var opcode = 0b1000;
            var tmp = line.split(' ')[1];
            var operand1 = parseInt(tmp.split(',')[0][1]); // r0..
            var operand2 = parseInt(tmp.split(',')[1][1]); // r1..
            var operand3 = parseInt(tmp.split(',')[2][1]); // r2..

            var l = (opcode << 4) + (operand1);
            var h = (operand2 << 4) + (operand3);

            memory[pc++] = h; // little endian
            memory[pc++] = l;
            continue;
        }
        // sub 처리
        if(/^sub/.test(line)) {
            var opcode = 0b1000;
            var tmp = line.split(' ')[1];
            var operand1 = parseInt(tmp.split(',')[0][1]); // r0..
            var operand2 = parseInt(tmp.split(',')[1][1]); // r1..
            var operand2 = parseInt(tmp.split(',')[2][1]); // r2..

            var l = (opcode << 4) + (operand1);
            var h = operand2;

            memory[pc++] = h; // little endian
            memory[pc++] = l;
            continue;
        }
    }
    pc = 0x7f; // 프로그램 시작 위치
    loadPage();
    loadRegisters();
}

function runLine(){
    var l = memory[pc++];
    var h = memory[pc++];
    ir = (h<<8) + l// fetch ir, TODO : 이런거 다 함수화 해야함
    var opcode = ir >> 12;

    
    // load 
    if(opcode == 0b0010) {
        var operand1 = (ir >> 8) & 0b1111;
        var operand2 = ir & 0b11111111;
        registers[operand1] = memory[operand2];
    }
    
    // store
    else if(opcode == 0b0011) {
        var operand1 = (ir >> 8) & 0b1111;
        var operand2 = ir & 0b11111111;
        memory[operand2] = registers[operand1];
    }

    // add
    else if(opcode == 0b1000) {
        var operand1 = (ir >> 8) & 0b1111;
        var operand2 = (ir >> 4) & 0b1111;
        var operand3 = ir & 0b1111;
        registers[operand1] = adder(registers[operand2], registers[operand3]);
    }

    // sub
    else if(opcode == 0b1001) {
        var operand1 = (ir >> 8) & 0b1111;
        var operand2 = (ir >> 4) & 0b1111;
        var operand3 = ir & 0b1111;
        registers[operand1] = subber(registers[operand2], registers[operand3]);
    }
    loadRegisters();
    loadPage();
}

var loadRegisters = function() {
    document.getElementById("pc").innerText = toTwoDigitHex(pc);
    document.getElementById("ir").innerText = toTwoDigitHex(ir);
    document.getElementById("r0").innerText = toTwoDigitHex(registers[0]);
    document.getElementById("r1").innerText = toTwoDigitHex(registers[1]);
    document.getElementById("r2").innerText = toTwoDigitHex(registers[2]);
    document.getElementById("r3").innerText = toTwoDigitHex(registers[3]);
    document.getElementById("r4").innerText = toTwoDigitHex(registers[4]);
    document.getElementById("r5").innerText = toTwoDigitHex(registers[5]);
    document.getElementById("r6").innerText = toTwoDigitHex(registers[6]);
    document.getElementById("r7").innerText = toTwoDigitHex(registers[7]);
}

document.getElementById("load_program").addEventListener('click', function() {
    loader(document.getElementById("code").value);
});

document.getElementById("run_line").addEventListener('click', function() {
    runLine();
});


var clearRegisters = function(){
    for(i=0;i<regs;i++){
        registers[i] = 0;
    }
    ir = 0;
    pc = 0xff;
    loadRegisters();
}

var clearMemory = function(){
    for(i=0;i<memorySize;i++){
        memory[i] = 0;
    }
    loadPage();
}