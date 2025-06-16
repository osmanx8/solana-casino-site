use anchor_lang::{prelude::*, AnchorDeserialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};
use solana_program::pubkey::Pubkey;

pub mod account;
pub mod constants;
pub mod error;
pub mod utils;

use account::*;
use constants::*;
use error::*;
use utils::*;

declare_id!("7ttfENVhNwb21KjZiLHgXLsX2sC1rKoJgnTVL4wb54t1");

#[program]
pub mod coinflip {
    use anchor_spl::token::transfer;

    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;

        sol_transfer_user(
            ctx.accounts.admin.to_account_info().clone(),
            ctx.accounts.reward_vault.to_account_info().clone(),
            ctx.accounts.system_program.to_account_info().clone(),
            ctx.accounts.rent.minimum_balance(0),
        )?;

        global_authority.super_admin = ctx.accounts.admin.key();
        global_authority.loyalty_wallet = LOYALTY_WALLET.parse::<Pubkey>().unwrap();
        global_authority.loyalty_fee = LOYALTY_FEE;

        Ok(())
    }

    pub fn initialize_player_pool(ctx: Context<InitializePlayerPool>) -> Result<()> {
        let mut player_pool = ctx.accounts.player_pool.load_init()?;
        player_pool.player = ctx.accounts.owner.key();
        msg!("Owner: {:?}", player_pool.player.to_string());

        Ok(())
    }

    pub fn update(ctx: Context<Update>, new_admin: Option<Pubkey>, loyalty_fee: u64) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;

        require!(
            ctx.accounts.admin.key() == global_authority.super_admin,
            GameError::InvalidAdmin
        );

        if let Some(new_admin) = new_admin {
            global_authority.super_admin = new_admin;
        }

        global_authority.loyalty_wallet = ctx.accounts.loyalty_wallet.key();
        global_authority.loyalty_fee = loyalty_fee;
        Ok(())
    }

    pub fn init_token_info(ctx: Context<InitTokenInfo>) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let token_info = &mut ctx.accounts.token_info;

        require!(
            global_authority.super_admin == ctx.accounts.admin.key(),
            GameError::InvalidAdmin
        );

        token_info.mint = ctx.accounts.mint.key();
        Ok(())
    }

    pub fn enable_token(ctx: Context<EnableToken>) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let token_info = &mut ctx.accounts.token_info;

        require!(
            global_authority.super_admin == ctx.accounts.admin.key(),
            GameError::InvalidAdmin
        );

        token_info.allowed = 1;
        Ok(())
    }

    pub fn disable_token(ctx: Context<DisableToken>) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let token_info = &mut ctx.accounts.token_info;

        require!(
            global_authority.super_admin == ctx.accounts.admin.key(),
            GameError::InvalidAdmin
        );

        token_info.allowed = 0;
        Ok(())
    }

    /**
    The main function to play dice.
    Input Args:
    set_number: The number is set by a player to play : 0: Tail, 1: Head
    deposit:    The SOL amount to deposit
    */
    #[access_control(user(&ctx.accounts.player_pool, &ctx.accounts.owner))]
    pub fn play_game(ctx: Context<PlayRound>, set_number: u64, deposit: u64) -> Result<()> {
        let mut player_pool = ctx.accounts.player_pool.load_mut()?;
        let global_authority = &mut ctx.accounts.global_authority;

        msg!("Deopsit: {}", deposit);

        // require!(
        //     player_pool.claimable_reward == 0,
        //     GameError::NeedClaimPendingReward
        // );

        msg!(
            "Vault Balance: {}",
            ctx.accounts.reward_vault.to_account_info().lamports()
        );
        msg!(
            "Owner Balance: {}",
            ctx.accounts.owner.to_account_info().lamports()
        );
        require!(
            ctx.accounts.owner.to_account_info().lamports() > deposit,
            GameError::InsufficientUserBalance
        );

        require!(
            ctx.accounts.reward_vault.to_account_info().lamports() > 2 * deposit,
            GameError::InsufficientRewardVault
        );

        require!(
            ctx.accounts.loyalty_wallet.to_account_info().key() == global_authority.loyalty_wallet,
            GameError::InvalidRewardVault
        );

        // 3% of deposit Sol
        let fee_price = deposit * global_authority.loyalty_fee / PERMILLE;

        // Transfer deposit Sol to this PDA
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            deposit,
        )?;

        // Transfer SOL to the loyalty_wallet
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.loyalty_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            fee_price,
        )?;

        // Generate random number
        let mut reward: u64 = 0;
        let timestamp = Clock::get()?.unix_timestamp;
        let slot = Clock::get()?.slot;
        let rand = get_random(&timestamp, &slot);
        // msg!("rand number: {}", rand);

        if rand == set_number {
            reward = 2 * deposit;
        }

        // Add game data to the blockchain
        player_pool.add_game_data(timestamp, deposit, reward, set_number, rand);

        global_authority.total_round += 1;

        if reward > 0 {
            msg!("Result: win");
        //     let vault_bump = *ctx.bumps.get("reward_vault").unwrap();
        //     // Transfer SOL to the winner from the PDA
        //     sol_transfer_with_signer(
        //         ctx.accounts.reward_vault.to_account_info(),
        //         ctx.accounts.owner.to_account_info(),
        //         ctx.accounts.system_program.to_account_info(),
        //         &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
        //         reward,
        //     )?;
        //     // player_pool.game_data.reward_amount = 0;
        //     // player_pool.claimable_reward = 0;
        } else {
            msg!("Result: lose");
        }

        Ok(())
    }

    /**
    The claim Reward function after playing
    */
    #[access_control(user(&ctx.accounts.player_pool, &ctx.accounts.player))]
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let _vault_bump = *ctx.bumps.get("reward_vault").unwrap();

        let mut player_pool = ctx.accounts.player_pool.load_mut()?;
        // require!(
        //     player_pool.claimable_reward == 1,
        //     GameError::NoPendingRewardExist
        // );
        let reward = player_pool.claimable_reward;
        require!(
            ctx.accounts.reward_vault.to_account_info().lamports() > reward,
            GameError::InsufficientRewardVault
        );
        if reward > 0 {
            // Transfer SOL to the winner from the PDA
            sol_transfer_with_signer(
                ctx.accounts.reward_vault.to_account_info(),
                ctx.accounts.player.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                &[&[VAULT_AUTHORITY_SEED.as_ref(), &[_vault_bump]]],
                reward,
            )?;
            // player_pool.game_data.reward_amount = 0;
        }
        player_pool.claimable_reward = 0;
        Ok(())
    }

    /**
    Withdraw function to withdraw SOL from the PDA with amount
    Args:
    amount: The sol amount to withdraw from this PDA
    Only Admin can withdraw SOL from this PDA
    */
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        require!(
            ctx.accounts.admin.key() == global_authority.super_admin
                || ctx.accounts.admin.key() == global_authority.loyalty_wallet,
            GameError::InvalidAdmin
        );

        let _vault_bump = *ctx.bumps.get("reward_vault").unwrap();

        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[_vault_bump]]],
            amount,
        )?;
        Ok(())
    }

    /**
    The main function to play dice.
    Input Args:
    set_number: The number is set by a player to play : 0: Tail, 1: Head
    deposit:    The SPL token amount to deposit
    */
    #[access_control(user(&ctx.accounts.player_pool, &ctx.accounts.owner))]
    pub fn play_game_with_token(
        ctx: Context<PlayRoundWithToken>,
        set_number: u64,
        deposit: u64,
    ) -> Result<()> {
        let mut player_pool = ctx.accounts.player_pool.load_mut()?;
        let global_authority = &mut ctx.accounts.global_authority;
        let token_info = &ctx.accounts.token_info;

        require!(
            token_info.mint == ctx.accounts.mint.key(),
            GameError::InvalidTokenMint
        );
        msg!("Deopsit: {}", deposit);

        // require!(
        //     player_pool.claimable_reward == 0,
        //     GameError::NeedClaimPendingReward
        // );

        msg!("Vault Balance: {}", ctx.accounts.reward_vault.amount);
        msg!(
            "User Token Balance: {}",
            ctx.accounts.user_token_account.amount
        );
        require!(
            ctx.accounts.user_token_account.amount > deposit,
            GameError::InsufficientUserBalance
        );

        require!(
            ctx.accounts.reward_vault.amount > 2 * deposit,
            GameError::InsufficientRewardVault
        );

        require!(
            ctx.accounts.loyalty_wallet.to_account_info().key() == global_authority.loyalty_wallet,
            GameError::InvalidRewardVault
        );

        // 3% of deposit Sol
        let fee_price = deposit * global_authority.loyalty_fee / PERMILLE;

        // Transfer deposit Token to this PDA
        let transfer_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.reward_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        );

        transfer(transfer_ctx, deposit)?;

        // Transfer Token to the loyalty_wallet
        let transfer_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.loyalty_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        );

        transfer(transfer_ctx, fee_price)?;

        // Generate random number
        let mut reward: u64 = 0;
        let timestamp = Clock::get()?.unix_timestamp;
        let slot = Clock::get()?.slot;
        let rand = get_random(&timestamp, &slot);
        // msg!("rand number: {}", rand);

        if rand == set_number {
            reward = 2 * deposit;
        }

        // Add game data to the blockchain
        player_pool.add_game_data(timestamp, deposit, reward, set_number, rand);

        global_authority.total_round += 1;

        if reward > 0 {
            msg!("Result: win");
        //     let vault_bump = *ctx.bumps.get("reward_vault").unwrap();
        //     // Transfer SOL to the winner from the PDA
        //     sol_transfer_with_signer(
        //         ctx.accounts.reward_vault.to_account_info(),
        //         ctx.accounts.owner.to_account_info(),
        //         ctx.accounts.system_program.to_account_info(),
        //         &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
        //         reward,
        //     )?;
        //     // player_pool.game_data.reward_amount = 0;
        //     // player_pool.claimable_reward = 0;
        } else {
            msg!("Result: lose");
        }

        Ok(())
    }

    /**
    The claim Reward function after playing
    */
    #[access_control(user(&ctx.accounts.player_pool, &ctx.accounts.player))]
    pub fn claim_reward_with_token(ctx: Context<ClaimRewardWithToken>) -> Result<()> {
        let mut player_pool = ctx.accounts.player_pool.load_mut()?;
        let token_info = &ctx.accounts.token_info;

        require!(
            token_info.mint == ctx.accounts.mint.key(),
            GameError::InvalidTokenMint
        );

        // require!(
        //     player_pool.claimable_reward == 1,
        //     GameError::NoPendingRewardExist
        // );
        let reward = player_pool.claimable_reward;
        require!(
            ctx.accounts.reward_vault.amount > reward,
            GameError::InsufficientRewardVault
        );
        if reward > 0 {
            let global_bump = *ctx.bumps.get("global_authority").unwrap();

            let transfer_accounts = Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.global_authority.to_account_info(),
            };

            let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];

            let signer = &[&seeds[..]];

            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_accounts,
                signer,
            );

            transfer(transfer_ctx, reward)?;
            // player_pool.game_data.reward_amount = 0;
        }
        player_pool.claimable_reward = 0;
        Ok(())
    }

    /**
    Deposit function to deposit SPL token from the PDA with amount
    Args:
    amount: The token amount to deposit from this PDA
    Only Admin can deposit SPL token from this PDA
    */
    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        let global_authority = &ctx.accounts.global_authority;
        let token_info = &ctx.accounts.token_info;

        require!(
            token_info.mint == ctx.accounts.mint.key(),
            GameError::InvalidTokenMint
        );

        require!(
            ctx.accounts.admin.key() == global_authority.super_admin
                || ctx.accounts.admin.key() == global_authority.loyalty_wallet,
            GameError::InvalidAdmin
        );

        require!(
            ctx.accounts.user_token_account.amount >= amount,
            GameError::InsufficientUserBalance,
        );

        let transfer_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.reward_vault.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        );

        transfer(transfer_ctx, amount)?;
        Ok(())
    }

    /**
    Withdraw function to withdraw SPL token from the PDA with amount
    Args:
    amount: The token amount to withdraw from this PDA
    Only Admin can withdraw SPL token from this PDA
    */
    pub fn withdraw_token(ctx: Context<WithdrawToken>, amount: u64) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let token_info = &ctx.accounts.token_info;

        require!(
            token_info.mint == ctx.accounts.mint.key(),
            GameError::InvalidTokenMint
        );

        require!(
            ctx.accounts.admin.key() == global_authority.super_admin
                || ctx.accounts.admin.key() == global_authority.loyalty_wallet,
            GameError::InvalidAdmin
        );

        require!(
            ctx.accounts.reward_vault.amount >= amount,
            GameError::InsufficientRewardVault,
        );

        let global_bump = *ctx.bumps.get("global_authority").unwrap();

        let transfer_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.global_authority.to_account_info(),
        };

        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];

        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
            signer,
        );

        transfer(transfer_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        space = 88,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub reward_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializePlayerPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(zero)]
    pub player_pool: AccountLoader<'info, PlayerPool>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loyalty_wallet: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitTokenInfo<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        space = 48,
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
        payer = admin,
    )]
    pub token_info: Account<'info, TokenInfo>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = global_authority
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct EnableToken<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub token_info: Account<'info, TokenInfo>,
}

#[derive(Accounts)]
pub struct DisableToken<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub token_info: Account<'info, TokenInfo>,
}

#[derive(Accounts)]
pub struct PlayRound<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub player_pool: AccountLoader<'info, PlayerPool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub reward_vault: AccountInfo<'info>,

    #[account(mut)]
    pub loyalty_wallet: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub player: SystemAccount<'info>,

    #[account(mut)]
    pub player_pool: AccountLoader<'info, PlayerPool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub reward_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub reward_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlayRoundWithToken<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub player_pool: AccountLoader<'info, PlayerPool>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub token_info: Account<'info, TokenInfo>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = global_authority
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub loyalty_wallet: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = loyalty_wallet
    )]
    pub loyalty_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimRewardWithToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub player: SystemAccount<'info>,

    #[account(mut)]
    pub player_pool: AccountLoader<'info, PlayerPool>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub token_info: Account<'info, TokenInfo>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = global_authority
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = player
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositToken<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub token_info: Account<'info, TokenInfo>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = global_authority
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = admin
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct WithdrawToken<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [TOKEN_INFO_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub token_info: Account<'info, TokenInfo>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = global_authority
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = admin
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Access control modifiers
fn user(pool_loader: &AccountLoader<PlayerPool>, user: &AccountInfo) -> Result<()> {
    let user_pool = pool_loader.load()?;
    require!(user_pool.player == *user.key, GameError::InvalidPlayerPool);
    Ok(())
}
