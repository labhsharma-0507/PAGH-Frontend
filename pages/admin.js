import { useState, useEffect } from 'react';
import { Guard, useAuth } from '../lib/auth';
import { Tabs } from '../components/ui';
import { can as canFn } from '../components/admin/perms';
import Dashboard from '../components/admin/Dashboard';
import Analytics from '../components/admin/Analytics';
import Orders from '../components/admin/Orders';
import Claims from '../components/admin/Claims';
import Verdict from '../components/admin/Verdict';
import { Partners, Users, Brands } from '../components/admin/People';
import Pricing from '../components/admin/Pricing';
import Money from '../components/admin/Money';
import Ops from '../components/admin/Ops';
import { Shop, Ads } from '../components/admin/ShopAds';
import Content from '../components/admin/Content';
import System from '../components/admin/System';

function Admin() {
  const { user } = useAuth(), can = (p) => canFn(user, p), [tab, setTab] = useState('dashboard');
  const TABS = [
    ['dashboard', 'Dashboard', can('analytics')], ['orders', 'Orders', can('orders:read')], ['claims', 'Claims', can('claims:review')], ['verdict', 'Verdict', can('verdict')],
    ['partners', 'Partners', can('partners')], ['batches', 'Batches', can('batches')], ['users', 'Users', can('users:read')], ['brands', 'Brands', can('brands')], ['pricing', 'Pricing & rules', can('pricing')],
    ['money', 'Payments & payouts', can('payments') || can('payouts')], ['shop', 'Shop', can('shop')], ['ads', 'Ads', can('ads')], ['content', 'Content', can('content')], ['analytics', 'Analytics', can('analytics')], ['system', 'System', can('notifications') || can('super')],
  ].filter((t) => t[2]);
  useEffect(() => { if (TABS.length && !TABS.find((t) => t[0] === tab)) setTab(TABS[0][0]); }, [user]); // eslint-disable-line
  const V = { dashboard: <Dashboard go={setTab} />, analytics: <Analytics />, orders: <Orders can={can} />, claims: <Claims can={can} />, verdict: <Verdict />, partners: <Partners can={can} />, batches: <Ops />, users: <Users can={can} />, brands: <Brands />, pricing: <Pricing />, money: <Money can={can} />, shop: <Shop />, ads: <Ads />, content: <Content />, system: <System can={can} /> };
  return (<><h1>Admin <span className="badge">{user.adminRole}</span></h1><Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => [t[0], t[1]])} />{V[tab]}</>);
}
export default function Page() { return <Guard roles={['admin']}><Admin /></Guard>; }
