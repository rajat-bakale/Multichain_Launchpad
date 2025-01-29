use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("DWwZ2Hc5Pzh4Kjo7ns8pVrqvLgKo622DydEFZ8XHz5iy");

#[program]
pub mod launchpad {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_bump: u8,
        start_time: i64,
        end_time: i64,
        total_tokens: u64,
        token_price: u64,
        min_contribution: u64,
        max_contribution: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.token_vault = ctx.accounts.token_vault.key();
        pool.start_time = start_time;
        pool.end_time = end_time;
        pool.total_tokens = total_tokens;
        pool.token_price = token_price;
        pool.min_contribution = min_contribution;
        pool.max_contribution = max_contribution;
        pool.total_raised = 0;
        pool.finalized = false;
        pool.bump = pool_bump;

        // Transfer tokens to vault
        let transfer_ix = Transfer {
            from: ctx.accounts.authority_token_account.to_account_info(),
            to: ctx.accounts.token_vault.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_ix),
            total_tokens,
        )?;

        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp >= pool.start_time,
            ErrorCode::PoolNotStarted
        );
        require!(clock.unix_timestamp <= pool.end_time, ErrorCode::PoolEnded);
        require!(!pool.finalized, ErrorCode::PoolFinalized);
        require!(
            amount >= pool.min_contribution,
            ErrorCode::BelowMinContribution
        );

        let user_contribution = &mut ctx.accounts.user_contribution;
        require!(
            user_contribution.amount + amount <= pool.max_contribution,
            ErrorCode::ExceedsMaxContribution
        );

        user_contribution.amount += amount;
        pool.total_raised += amount;

        Ok(())
    }

    pub fn finalize_pool(ctx: Context<FinalizePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp > pool.end_time,
            ErrorCode::PoolNotEnded
        );
        require!(!pool.finalized, ErrorCode::PoolFinalized);

        pool.finalized = true;

        // Transfer raised funds to authority
        **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= pool.total_raised;
        **ctx.accounts.authority.try_borrow_mut_lamports()? += pool.total_raised;

        Ok(())
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        let pool = &ctx.accounts.pool;
        require!(pool.finalized, ErrorCode::PoolNotFinalized);

        let user_contribution = &mut ctx.accounts.user_contribution;
        let contribution_amount = user_contribution.amount;
        require!(contribution_amount > 0, ErrorCode::NoContribution);

        let token_amount = (contribution_amount as u128)
            .checked_mul(1_000_000_000)
            .unwrap()
            .checked_div(pool.token_price as u128)
            .unwrap() as u64;

        let pool_seeds = &[b"pool".as_ref(), &pool.token_mint.to_bytes(), &[pool.bump]];
        let pool_signer = &[&pool_seeds[..]];

        let transfer_ix = Transfer {
            from: ctx.accounts.token_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_ix,
                pool_signer,
            ),
            token_amount,
        )?;

        user_contribution.amount = 0;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pool_bump: u8)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_mint: Account<'info, token::Mint>,
    #[account(
        init,
        payer = authority,
        space = 8 + Pool::LEN,
        seeds = [b"pool".as_ref(), token_mint.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = pool,
    )]
    pub token_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = authority_token_account.owner == authority.key(),
        constraint = authority_token_account.mint == token_mint.key()
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(
        init_if_needed,
        payer = contributor,
        space = 8 + UserContribution::LEN,
        seeds = [b"contribution".as_ref(), pool.key().as_ref(), contributor.key().as_ref()],
        bump,
    )]
    pub user_contribution: Account<'info, UserContribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizePool<'info> {
    #[account(
        mut,
        constraint = pool.authority == authority.key()
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub pool_vault: SystemAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        seeds = [b"contribution".as_ref(), pool.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_contribution: Account<'info, UserContribution>,
    #[account(mut)]
    pub token_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub token_vault: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub total_tokens: u64,
    pub token_price: u64,
    pub min_contribution: u64,
    pub max_contribution: u64,
    pub total_raised: u64,
    pub finalized: bool,
    pub bump: u8,
}

#[account]
pub struct UserContribution {
    pub amount: u64,
}

impl Pool {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}

impl UserContribution {
    pub const LEN: usize = 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Pool has not started")]
    PoolNotStarted,
    #[msg("Pool has ended")]
    PoolEnded,
    #[msg("Pool is already finalized")]
    PoolFinalized,
    #[msg("Contribution is below minimum amount")]
    BelowMinContribution,
    #[msg("Contribution exceeds maximum amount")]
    ExceedsMaxContribution,
    #[msg("Pool has not ended")]
    PoolNotEnded,
    #[msg("Pool is not finalized")]
    PoolNotFinalized,
    #[msg("No contribution found")]
    NoContribution,
}
