import { lazy } from 'react';

// Auth
export const Onboarding = lazy(() => import('./auth/Onboarding'));
export const Login = lazy(() => import('./auth/Login'));
export const SignUp = lazy(() => import('./auth/SignUp'));

// Common
export const Dashboard = lazy(() => import('./common/Dashboard'));
export const Profile = lazy(() => import('./common/Profile'));
export const PersonalInformation = lazy(() => import('./common/PersonalInformation'));
export const Tracking = lazy(() => import('./common/Tracking'));
export const ReportGenerator = lazy(() => import('./common/ReportGenerator'));

// Machines
export const MachineList = lazy(() => import('./machines/MachineList'));
export const MachineLog = lazy(() => import('./machines/MachineLog'));
export const AddMachine = lazy(() => import('./machines/AddMachine'));
export const AddMachineEntry = lazy(() => import('./machines/AddMachineEntry'));
export const MachineSettlement = lazy(() => import('./machines/MachineSettlement'));
export const MachineSettleDetail = lazy(() => import('./machines/MachineSettleDetail'));
export const MaintenanceAlerts = lazy(() => import('./machines/MaintenanceAlerts'));
export const FarmerHarvest = lazy(() => import('./machines/FarmerHarvest'));
export const HarvestFarmerList = lazy(() => import('./machines/HarvestFarmerList'));

// Paddy
export const Lots = lazy(() => import('./paddy/Lots'));
export const LotDetails = lazy(() => import('./paddy/LotDetails'));
export const EditBatch = lazy(() => import('./paddy/EditBatch'));
export const AddLot = lazy(() => import('./paddy/AddLot'));
export const LotStages = lazy(() => import('./paddy/LotStages'));
export const WarehouseCapacity = lazy(() => import('./paddy/WarehouseCapacity'));
export const SaleReceipt = lazy(() => import('./paddy/SaleReceipt'));

// Finance
export const FarmerSettlement = lazy(() => import('./finance/FarmerSettlement'));
export const MillSettlement = lazy(() => import('./finance/MillSettlement'));
export const MillSettlementList = lazy(() => import('./finance/MillSettlementList'));

// Trader
export const TraderUsers = lazy(() => import('./trader/TraderUsers'));
export const MachineEarn = lazy(() => import('./trader/MachineEarn'));
export const PaddyEarn = lazy(() => import('./trader/PaddyEarn'));
export const TraderEntries = lazy(() => import('./trader/TraderEntries'));
export const TraderFleet = lazy(() => import('./trader/TraderFleet'));
export const TraderLogs = lazy(() => import('./trader/TraderLogs'));
export const AddMill = lazy(() => import('./trader/AddMill'));
