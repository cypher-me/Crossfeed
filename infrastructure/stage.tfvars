aws_region        = "us-east-1"
project           = "Crossfeed"
stage             = "staging"
frontend_domain   = "staging.crossfeed.cyber.dhs.gov"
api_domain        = "api.staging.crossfeed.cyber.dhs.gov"
frontend_cert_arn = "arn:aws:acm:us-east-1:563873274798:certificate/7c6a5980-80e3-47a4-9f21-cbda44b6f34c"
db_name           = "crossfeed-stage-db"
db_port           = 5432
db_table_name     = "cfstagingdb"
ssm_lambda_subnet = "/crossfeed/staging/SUBNET_ID"
ssm_lambda_sg     = "/crossfeed/staging/SG_ID"
ssm_worker_subnet = "/crossfeed/staging/WORKER_SUBNET_ID"
ssm_worker_sg     = "/crossfeed/staging/WORKER_SG_ID"
ssm_db_name       = "/crossfeed/staging/DATABASE_NAME"
ssm_db_host       = "/crossfeed/staging/DATABASE_HOST"
ssm_db_username   = "/crossfeed/staging/DATABASE_USER"
ssm_db_password   = "/crossfeed/staging/DATABASE_PASSWORD"
cloudfront_name   = "Crossfeed Staging Frontend"
db_group_name     = "crossfeed-staging-db-group"
worker_ecs_repository_name        = "crossfeed-staging-worker"
worker_ecs_cluster_name           = "crossfeed-staging-worker"
worker_ecs_task_definition_family = "crossfeed-staging-worker"
worker_ecs_log_group_name         = "crossfeed-staging-worker"
worker_ecs_role_name         = "crossfeed-staging-worker"
