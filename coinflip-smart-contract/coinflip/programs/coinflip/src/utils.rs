use anchor_lang::prelude::*;
use solana_program::program::{
    invoke_signed,
    invoke,
};

// transfer sol
pub fn sol_transfer_with_signer<'a>(
    source: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    signers: &[&[&[u8]]; 1],
    amount: u64,
) -> Result<()> {
    let ix = solana_program::system_instruction::transfer(source.key, destination.key, amount);
    invoke_signed(&ix, &[source, destination, system_program], signers)?;
    Ok(())
}

pub fn sol_transfer_user<'a>(
    source: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    amount: u64,
) -> Result<()> {
    let ix = solana_program::system_instruction::transfer(source.key, destination.key, amount);
    invoke(&ix, &[source, destination, system_program])?;
    Ok(())
}

pub fn puffed_out_string(s: &String, size: usize) -> String {
    let mut array_of_zeroes = vec![];
    
    let puff_amount = size - s.len();
    while array_of_zeroes.len() < puff_amount {
        array_of_zeroes.push(0u8);
    }
    s.clone() + std::str::from_utf8(&array_of_zeroes).unwrap()
}

pub fn get_random(timestamp: &i64, slot: &u64) -> u64 {
    // Get the random number of the entrant amount
    let (player_address, _bump) = Pubkey::find_program_address(
        &[
            "rand-seed".as_bytes(),
            timestamp.to_string().as_bytes(),
        ],
        &crate::ID,
    );
    let char_vec: Vec<char> = player_address.to_string().chars().collect();
    let mut mul = 1;
    for i in 0..7 {
        mul += u64::from(char_vec[i as usize]);
    }
    mul += slot;
    mul % 2
}
