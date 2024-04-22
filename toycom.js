class Register {
    /*
    Register class
    name : ragister name, bits : register size in bits, value : initial value
    */
    constructor(name,bits,value){
        this.name = name
        this.bits = bits;
        this.mask = (2**(this.bits + 1) - 1);
        this.value = 0;
        this.put(value);
    }
    getHexCode(){
        let hex = this.value.toString(16).toUpperCase();
        return "0x" + "0".repeat(this.bits/4-hex.length) + hex;
    }
    put(value){
        if(typeof(value) !== 'number') {
            console.error(this.name + " value type error");
            return;
        }
        this.value = value & this.mask;
    }
    get(){
        return this.value;
    }
    log(){
        console.log(this.name + " : " + this.getHexCode());
    }
}

class ALU {
    /*
    ALU class
    size : word size in bytes
    */
    constructor(bits){
        this.bits = bits;
        this.mask = (1<<(this.bits + 1) - 1);
    }

    adder (a, b) {
        return (a+b) & this.mask;
    }
    
    subber (a, b) {
        return adder(a, this.twosComplement(b));
    }
    
    twosComplement (a) {
        return (~a) & this.mask;
    }
    
    and (a, b) {
        return a & b & this.mask;
    }
    
    or (a, b) {
        return a | b & this.mask;
    }
}

class Memory {
    /*
    Memory class
    addressBits : address length in bits
    dataBits : data per address size in bits
    */
    constructor(addressBits, dataBits){
        this.addressBits = addressBits;
        this.count = 2**addressBits;
        this.dataBits = dataBits;
        this.mask = (2**(this.dataBits + 1) - 1);
        this.memory = [];
        for (var i = 0; i < this.count; i++) {
            this.memory.push(0);
        }
    }

    init(){
        for (var i = 0; i < this.count; i++) {
            this.memory[i] = 0;
        }
    }

    getHexCode(value, bits) {
        var prefix = "0x"
        if(value < 0) {
            prefix = "-0x"
            value = value*-1;
        } 
        let hex = value.toString(16).toUpperCase();
        var repeat = bits/4-hex.length;
        return prefix + "0".repeat(repeat < 0 ? 0 : repeat) + hex;
    }

    getHexCodeData(address){ 
        return this.getHexCode(this.memory[this.purifyAddress(address)], this.dataBits);
    }

    getHexCodeAddress(address){
        return this.getHexCode(address, this.addressBits);
    }

    /*
    purifyAddress : address를 정규화하는 함수
    */
    purifyAddress(address){
        if(typeof(address) !== 'number') {
            console.error("Memory address type error");
            return 0;
        }

        var purifiedAddress = address;

        if (purifiedAddress < 0) { // underflow 구현
            purifiedAddress = this.count - ((-1*purifiedAddress) % this.count);
        }

        if (purifiedAddress >= this.count) { // overflow 구현
            purifiedAddress = purifiedAddress % this.count;
        }

        if(address < 0 || address >= this.count) {
            console.warn("Memory out of range : " + this.getHexCodeAddress(address) + ", purified to " + this.getHexCodeAddress(purifiedAddress));
        }
        return purifiedAddress;
    }

    load(address){
        return this.memory[this.purifyAddress(address)];
    }

    store(address, value){
        this.memory[this.purifyAddress(address)] = value & this.mask;
    }

    log(address){
        address = this.purifyAddress(address)
        console.log(this.getHexCodeAddress(address) + " : " + this.getHexCodeData(address));
    }
}

var alu = new ALU(1);
var mem = new Memory(16, 8);

var pc = new Register("PC", 8, 0x7f);
var ir = new Register("IR", 16, 0);
var sp = new Register("SP", 8, 0xff);
var sr = new Register("SR", 8, 0);
var mbr = new Register("MBR", 8, 0);
var mar = new Register("MAR", 8, 0);

var r0 = new Register("R0", 8, 0);
var r1 = new Register("R1", 8, 0);
var r2 = new Register("R2", 8, 0);
var r3 = new Register("R3", 8, 0);
var r4 = new Register("R4", 8, 0);
var r5 = new Register("R5", 8, 0);
var r6 = new Register("R6", 8, 0);
var r7 = new Register("R7", 8, 0);

var registers = [r0, r1, r2, r3, r4, r5, r6, r7];




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