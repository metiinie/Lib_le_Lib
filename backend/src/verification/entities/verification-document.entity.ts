import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationRecord } from './verification-record.entity';

@Entity('documents', { schema: 'verification' })
export class VerificationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VerificationRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_record_id' })
  verificationRecord: VerificationRecord;

  @Column({ name: 'verification_record_id', type: 'uuid' })
  verificationRecordId: string;

  @Column({ name: 'document_type', type: 'text' })
  documentType: string;

  @Column({ name: 'storage_ref', type: 'text', nullable: true })
  storageRef: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date;
}
