"use server"
import {z} from "zod"
import { Invoice } from "./definitions";
import { sql  } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const FormSchema  = z.object({
    id:z.string(),
    customerId:z.string(),
    amount:z.coerce.number(),
    status:z.enum(["pending","paid"]),
    date:z.string()
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoices(formData:FormData) {
    const { customerId, amount, status } =  CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      })
    
       /*
        si hay un monton de se puede hacer
        Object.fromEntries(fromData.entries())
        */
    //creamo la fecha actual
    const [date] = new Date().toISOString().split("T") 
     //lo trandformamos a centavos   
    const amountCents = amount *100

    
    await sql` INSERT INTO invoices  (customer_id, amount, status, date) 
    VALUES (${customerId},${amountCents},${status},${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}