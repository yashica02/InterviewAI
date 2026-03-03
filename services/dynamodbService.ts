import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Single client instance
const client = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION as string,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY as string
  }
});

export interface CreateSessionData {
  email: string;
  company: string;
  role: string;
  questions: any[];
  otp: string;
}

export interface GetSessionResult {
  sessionId: string;
  otp: string;
  candidateEmail: string;
  companyName: string;
  jobTitle: string;
  status: string;
  questions: any[];
  createdAt: number;
}

export async function createInterviewSession(data: CreateSessionData) {
  const sessionId = `COMPLETED_${Math.floor(Math.random() * 1000)}`;
  
  console.log('🚀 Creating session:', {
    email: data.email,
    company: data.company,
    role: data.role,
    otp: data.otp,
    questionsLength: data.questions.length
  });

  const params = {
    TableName: import.meta.env.VITE_DYNAMODB_TABLE as string,
    Item: {
      PK: `USER#${data.email}`,
      SK: `INTERVIEW#${sessionId}`,
      email: data.email,
      company: data.company,
      role: data.role,
      status: 'QUESTIONS_READY',
      otp: data.otp,
      questions: JSON.stringify(data.questions),
      created_date: new Date().toISOString()
    }
  };

  console.log('📦 DynamoDB params:', JSON.stringify(params, null, 2));

  try {
    const command = new PutCommand(params);
    const result = await client.send(command);
    console.log('✅ DynamoDB success:', result);
    return { sessionId, otp: data.otp };
  } catch (error: any) {
    console.error('❌ DynamoDB ERROR:', {
      message: error.message,
      name: error.name,
      code: error.$metadata?.httpStatusCode
    });
    throw error;
  }
}

export async function getSessionByEmailOtp(email: string, otp: string): Promise<GetSessionResult | null> {
  try {
    const command = new QueryCommand({
      TableName: import.meta.env.VITE_DYNAMODB_TABLE as string,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${email}`,
        ':sk': 'INTERVIEW#'
      }
    });

    const result = await client.send(command);
    
    if (result.Items && result.Items.length > 0) {
      const session = result.Items.find(item => item.otp === otp);
      if (session) {
        return {
          sessionId: session.SK!.split('#')[1] || '',
          otp: session.otp || '',
          candidateEmail: session.email || '',
          companyName: session.company || '',
          jobTitle: session.role || '',
          status: session.status || '',
          questions: JSON.parse(session.questions || '[]'),
          createdAt: new Date(session.created_date || 0).getTime()
        };
      }
    }
    return null;
  } catch (error) {
    console.error('❌ getSessionByEmailOtp error:', error);
    return null;
  }
}
