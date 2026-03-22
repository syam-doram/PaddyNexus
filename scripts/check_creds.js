
import mongoose from 'mongoose';

// Direct connection string to bypass SRV DNS issues
const uri = 'mongodb://syamkdoram_db_user:LLCqKjfpxZCfDCVS@ac-paddy-cluster-shard-00-00.mwdyyx3.mongodb.net:27017,ac-paddy-cluster-shard-00-01.mwdyyx3.mongodb.net:27017,ac-paddy-cluster-shard-00-02.mwdyyx3.mongodb.net:27017/paddynexus?replicaSet=atlas-87hr9y-shard-0&ssl=true&authSource=admin';

async function check() {
  try {
    console.log('Connecting via Direct Nodes...');
    await mongoose.connect(uri);
    console.log('Connected!');
    
    const User = mongoose.model('User', new mongoose.Schema({ name: String, mobile: String, password: String, role: String }, { strict: false }));
    const users = await User.find({});
    
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`[${u.role}] Mobile: ${u.mobile}, PW: ${u.password}, Name: ${u.name}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Connection Failed:', err.message);
    process.exit(1);
  }
}

check();
