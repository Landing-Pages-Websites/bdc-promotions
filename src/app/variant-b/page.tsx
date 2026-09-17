import type { Metadata } from "next";
import { DealerFieldJournal } from "@/components/review/variant-b/DealerFieldJournal";
export const metadata:Metadata={title:"Dealer Field Journal | BDC Promotions",description:"An editorial, documentary BDC Promotions homepage direction.",robots:{index:false,follow:false}};
export default function Page(){return <DealerFieldJournal/>}
