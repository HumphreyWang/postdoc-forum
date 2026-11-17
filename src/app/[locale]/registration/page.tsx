import {setRequestLocale} from 'next-intl/server';
import FormPage from '@/components/FormPage';
export const dynamic = 'force-dynamic';
export default async function Registration({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;setRequestLocale(locale);return <FormPage/>;
}
