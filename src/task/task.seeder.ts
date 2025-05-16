import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class TaskSeeder {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async seed() {
    // Clear existing tasks
    await this.taskModel.deleteMany({});

    const tasks = [
      {
        title: 'Real Estate Asset Verification and Location Mapping',
        description:
          'Conduct on-site verification of real estate properties and create detailed location mapping for tokenization. Tasks include: photographing the property, verifying coordinates, checking property conditions, and creating a comprehensive digital report. Experience with real estate assessment and geolocation tools required.',
        deadline: 10,
        tags: ['real-estate', 'verification', 'mapping', 'rwa'],
      },
      {
        title: 'RWA Smart Contract Development and Audit',
        description:
          'Develop and audit smart contracts for Real World Asset tokenization platform. Focus on implementing ERC-3643 token standard for compliant RWA tokenization, including KYC/AML checks, transfer restrictions, and regulatory compliance features. Strong background in Solidity and security auditing required.',
        deadline: 21,
        tags: ['smart-contracts', 'security', 'audit', 'rwa-tokenization'],
      },
      {
        title: 'Asset Documentation and Compliance Verification',
        description:
          'Review and verify legal documentation for real-world assets before tokenization. Tasks include: analyzing property deeds, checking regulatory compliance, verifying ownership chains, and preparing digital documentation packages. Legal background or experience with property documentation preferred.',
        deadline: 7,
        tags: ['legal', 'compliance', 'documentation', 'verification'],
      },
    ];

    // Insert tasks
    await this.taskModel.insertMany(tasks);
    console.log('Tasks seeded successfully!');
  }
}
