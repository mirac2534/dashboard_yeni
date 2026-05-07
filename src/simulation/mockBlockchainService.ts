import { sha256Hex } from './hashService';
import type { BlockchainRecord, HashedTelemetryFrame, VerificationStatus } from './telemetryTypes';

export class MockBlockchainService {
  private records: BlockchainRecord[] = [];
  private nextBlockNo = 54_000;

  async commitTelemetryHash(packet: HashedTelemetryFrame): Promise<HashedTelemetryFrame> {
    const blockNo = this.nextBlockNo + Math.floor(this.records.length / 3);
    const txDigest = await sha256Hex(`${packet.blockchain.payloadHash}:${packet.blockchain.sequenceNo}:${blockNo}`);
    const txId = `0x${txDigest.slice(0, 48)}`;
    const verificationStatus = this.verifyPacket(packet);

    const record: BlockchainRecord = {
      packetId: packet.blockchain.packetId,
      sequenceNo: packet.blockchain.sequenceNo,
      payloadHash: packet.blockchain.payloadHash,
      previousPacketHash: packet.blockchain.previousPacketHash,
      blockNo,
      txId,
      committedAt: Date.now(),
      verificationStatus,
    };

    this.records = [...this.records, record].slice(-180);

    return {
      ...packet,
      blockchain: {
        ...packet.blockchain,
        blockNo,
        txId,
        verificationStatus,
      },
    };
  }

  verifyPacket(packet: HashedTelemetryFrame): VerificationStatus {
    const previousRecord = this.records[this.records.length - 1];
    if (previousRecord && packet.blockchain.previousPacketHash !== previousRecord.payloadHash) {
      return 'TAMPER_DETECTED';
    }

    return 'VERIFIED';
  }

  getRecords(): BlockchainRecord[] {
    return this.records;
  }

  getLatestRecord(): BlockchainRecord | undefined {
    return this.records[this.records.length - 1];
  }

  reset() {
    this.records = [];
    this.nextBlockNo = 54_000;
  }
}
