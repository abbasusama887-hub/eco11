import os

from storages.backends.s3 import S3Storage


class SupabasePublicStorage(S3Storage):

    def url(self, name, parameters=None, expire=None, http_method=None):
        name = str(name).lstrip("/")

        supabase_url = os.getenv("SUPABASE_URL")

        if not supabase_url:
            project_ref = os.getenv("SUPABASE_PROJECT_REF")

            if not project_ref:
                raise ValueError(
                    "SUPABASE_URL or SUPABASE_PROJECT_REF is required"
                )

            supabase_url = f"https://{project_ref}.supabase.co"

        bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "media")

        return (
            f"{supabase_url}/storage/v1/object/public/"
            f"{bucket}/{name}"
        )