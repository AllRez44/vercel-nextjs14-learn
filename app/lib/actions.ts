'use server';

import { z } from 'zod';
import { sql } from  '@vercel/postgres'
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  console.log('validatedFields:')
  console.log(validatedFields)
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Test it out:
  console.log('customerId: ' + customerId);
  console.log('amount: ' + amount);
  console.log('amountInCents: ' + amountInCents);
  console.log('status: ' + status);
  console.log('date: ' + date);
  // DB Query
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `
    console.log('Invoice created successfully')
    revalidatePath('/dashboard/invoices');
  }
  catch (error)
  {
    console.log('Database error:', error)

    return {
      message: `Failed to create invoice`
    }
  }
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, prevState:State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  // const date = new Date().toISOString().split('T')[0];
  // Test it out:
  console.log('customerId: ' + customerId);
  console.log('amount: ' + amount);
  console.log('amountInCents: ' + amountInCents);
  console.log('status: ' + status);
  // console.log('date: ' + date);
  // DB Query
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `
    console.log(`Invoice ${id} updated successfully`)
    revalidatePath('/dashboard/invoices');
  }
  catch (error)
  {
    console.log('Database error:', error)
    console.log('Invoice: ', id)
    return {
      message: `Failed to update invoice`
    }
  }
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // const date = new Date().toISOString().split('T')[0];
  // Test it out:
  // DB Query
  try {
    // TODO: Uncomment after fixing error handling
    // await sql`DELETE FROM invoices WHERE id = ${id}`
    await sql`DELETE FROM invoices WHERE id = ${id}`
    console.log(`Invoice ${id} deleted successfully`)
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice delete successfully' }
  }
  catch (error)
  {
    console.log('Database error:', error);
    console.log('Invoice: ', id)
    return {
     message: `Failed to delete invoice`,
    }
  }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
  try {
     await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if ((error as Error).message.includes('credentialsSignin')) {
      return 'credentailsSigninError'
    }
    throw error;
  }
}

export async function singOutUser(){
  await signOut();
}