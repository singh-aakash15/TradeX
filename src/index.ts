console.log("=========================================");
console.log("🚀 TradeX Stock Exchange Server Starting");
console.log("=========================================");

// TypeScript "Interface" - Blueprint for Server Info
interface ServerInfo {
    name: string;
    version: string;
    environment: string;
    startTime: Date;
}

const serverInfo: ServerInfo = {
    name: "TradeX Matching Engine",
    version: "1.0.0",
    environment: "Development",
    startTime: new Date()
};

console.log(`Server Name  : ${serverInfo.name}`);
console.log(`Version      : ${serverInfo.version}`);
console.log(`Environment  : ${serverInfo.environment}`);
console.log(`Started At   : ${serverInfo.startTime.toISOString()}`);
console.log("=========================================");
