import RegisterClient from '../../register/RegisterClient';

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ReferralRegisterPage({ params }: Props) {
  const { username } = await params;
  return <RegisterClient forcedReferralUsername={decodeURIComponent(username || '').replace(/^@/, '')} />;
}
